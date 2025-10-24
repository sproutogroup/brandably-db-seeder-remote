const { writeCSV } = require("../lib/utils");
const {
 getFileSize,
 calculateChecksum,
 uploadToSupabase,
} = require("../services/upload-to-supabase");
const path = require("path");
const fs = require("fs").promises; // 👈 Added for file deletion

async function processImages(
 imageMap,
 skuToVariantId,
 dataDir,
 imagesSourceDir,
 useSupabase
) {
 console.log("\n🖼️  Processing product images...");
 console.log(
  `   ${
   useSupabase ? "☁️  Mode: Upload to Supabase" : "💾 Mode: Local storage only"
  }`
 );
 const images = [];
 let imageId = 1;
 let totalImages = 0;
 let variantsWithImages = 0;
 let uploadedCount = 0;
 let failedCount = 0;
 let deletedCount = 0; // 👈 Track deleted files

 // Track which variants have images
 const variantsWithImageSet = new Set();

 // Create lowercase SKU map for case-insensitive lookup
 const lowercaseSkuToVariantId = new Map(
  Array.from(skuToVariantId, ([key, value]) => [key.toLowerCase(), value])
 );

 // Calculate total for progress reporting
 const totalToProcess = Array.from(imageMap.values()).reduce(
  (sum, files) => sum + files.length,
  0
 );
 let processedCount = 0;

 console.log(`   📦 Total images to process: ${totalToProcess}`);
 console.log(`   🔄 Starting process...\n`);

 // Iterate through imageMap (ItemCode -> array of filenames)
 for (const [itemCode, filenames] of imageMap.entries()) {
  let variantId = lowercaseSkuToVariantId.get(itemCode.toLowerCase());
  let variantIds = [];

  if (!variantId) {
   const sizes = [
    "XXS",
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "XXXL",
    "4XL",
    "5XL",
   ];

   // Iterate through all keys in lowercaseSkuToVariantId
   for (const [skuKey, skuVariantId] of lowercaseSkuToVariantId.entries()) {
    // Check if this key matches itemCode when size is removed
    let baseSkuKey = skuKey;

    for (const size of sizes) {
     if (baseSkuKey.endsWith(`.${size.toLowerCase()}`)) {
      baseSkuKey = baseSkuKey.slice(0, -(size.toLowerCase().length + 1));
      break;
     }
    }

    // If the base key matches our itemCode, collect this variant
    if (baseSkuKey === itemCode.toLowerCase()) {
     variantIds.push(skuVariantId);
    }
   }

   if (variantIds.length > 0) {
    console.log(
     `   ℹ️  Found ${variantIds.length} size variants for: ${itemCode}`
    );
   }
  } else {
   variantIds.push(variantId);
  }

  if (variantIds.length === 0) {
   console.log(
    `   ⚠️  Warning: No variant found for ItemCode: ${itemCode} (${filenames.length} images skipped)`
   );
   processedCount += filenames.length;
   continue;
  }

  // Add all variants to tracking set
  variantIds.forEach((id) => variantsWithImageSet.add(id));

  // Process each image for this ItemCode
  for (let i = 0; i < filenames.length; i++) {
   const filename = filenames[i];
   const localFilePath = path.join(imagesSourceDir, filename);
   const isCover = filename.includes("__S_0");

   // 👇 Create images for EACH variant
   for (const variantId of variantIds) {
    processedCount++;

    // Initialize image object
    const imageObj = {
     id: imageId,
     file_name: filename,
     file_url: "",
     is_cover: isCover,
     product_variant: variantId,
     supabase_path: null,
     upload_status: useSupabase ? "pending" : "local",
     uploaded_at: null,
     file_size: null,
     upload_error: null,
     checksum: null,
    };

    try {
     // Get file metadata once per file (not per variant)
     if (variantIds.indexOf(variantId) === 0) {
      imageObj.file_size = await getFileSize(localFilePath);
      imageObj.checksum = await calculateChecksum(localFilePath);
     }

     if (useSupabase) {
      // ============ SUPABASE MODE ============
      // Only upload once per file, then reuse the URL
      if (variantIds.indexOf(variantId) === 0) {
       const uploadResult = await uploadToSupabase(
        localFilePath,
        filename,
        itemCode
       );

       if (uploadResult.success) {
        imageObj.file_url = uploadResult.publicUrl;
        imageObj.supabase_path = uploadResult.storagePath;
        imageObj.uploaded_at = uploadResult.uploadedAt;
        imageObj.upload_status = "uploaded";
        uploadedCount++;

        console.log(
         `   ✅ [${processedCount}/${totalToProcess}] Uploaded: ${filename} (for ${variantIds.length} variants)`
        );

        // 👇 Delete the file after successful upload
        try {
         await fs.unlink(localFilePath);
         deletedCount++;
         console.log(`   🗑️  Deleted local file: ${filename}`);
        } catch (deleteError) {
         console.log(
          `   ⚠️  Could not delete file ${filename}: ${deleteError.message}`
         );
        }
       } else {
        imageObj.file_url = `/images/products/${filename}`;
        imageObj.upload_status = "failed";
        imageObj.upload_error = uploadResult.error || "Unknown error";
        failedCount++;
        console.log(
         `   ❌ [${processedCount}/${totalToProcess}] Failed: ${filename}`
        );
        console.log(`      Error: ${uploadResult.error}`);
       }
      } else {
       // For subsequent variants, reuse the same upload info
       const firstImage = images.find((img) => img.file_name === filename);
       if (firstImage) {
        imageObj.file_url = firstImage.file_url;
        imageObj.supabase_path = firstImage.supabase_path;
        imageObj.uploaded_at = firstImage.uploaded_at;
        imageObj.upload_status = firstImage.upload_status;
        imageObj.upload_error = firstImage.upload_error;
        imageObj.file_size = firstImage.file_size;
        imageObj.checksum = firstImage.checksum;
       }
      }
     } else {
      // ============ LOCAL MODE ============
      imageObj.file_url = `/images/products/${filename}`;
      imageObj.upload_status = "local";
      imageObj.supabase_path = null;
      uploadedCount++;

      if (processedCount % 25 === 1 || processedCount === totalToProcess) {
       console.log(
        `   📁 [${processedCount}/${totalToProcess}] Processed: ${filename} (for ${variantIds.length} variants)`
       );
      }
     }
    } catch (error) {
     imageObj.file_url = `/images/products/${filename}`;
     imageObj.upload_status = "failed";
     imageObj.upload_error = error.message;
     failedCount++;
     console.log(
      `   ❌ [${processedCount}/${totalToProcess}] Exception: ${filename}`
     );
     console.log(`      Error: ${error.message}`);
    }

    images.push(imageObj);
    imageId++;
    totalImages++;

    // Show progress every 50 images
    if (processedCount % 50 === 0) {
     const percentage = ((processedCount / totalToProcess) * 100).toFixed(1);
     if (useSupabase) {
      console.log(
       `   📊 Progress: ${processedCount}/${totalToProcess} (${percentage}%) - ✅ ${uploadedCount} | ❌ ${failedCount} | 🗑️ ${deletedCount}`
      );
     } else {
      console.log(
       `   📊 Progress: ${processedCount}/${totalToProcess} (${percentage}%) - 📁 ${uploadedCount} processed`
      );
     }
    }
   }
  }
 }

 variantsWithImages = variantsWithImageSet.size;

 // Write to CSV
 console.log(`\n💾 Writing product_images.csv...`);
 await writeCSV("product_images.csv", images, dataDir);

 // Final summary
 console.log(`\n📊 ============ IMAGE PROCESSING SUMMARY ============`);
 console.log(
  `   ${useSupabase ? "☁️  Mode: Supabase Upload" : "💾 Mode: Local Storage"}`
 );
 console.log(`   📦 Total images processed: ${totalImages}`);
 if (useSupabase) {
  console.log(`   ✅ Successfully uploaded: ${uploadedCount}`);
  console.log(`   🗑️  Files deleted: ${deletedCount}`);
  console.log(`   ❌ Failed uploads: ${failedCount}`);
 } else {
  console.log(`   📁 Local references created: ${uploadedCount}`);
  console.log(`   ❌ Failed to process: ${failedCount}`);
 }
 console.log(`   🏷️  Variants with images: ${variantsWithImages}`);
 console.log(`   📁 Output: data/product_images.csv`);
 console.log(`================================================\n`);

 return {
  images,
  totalImages,
  variantsWithImages,
  uploadedCount,
  deletedCount, // 👈 Added to return value
  failedCount,
  mode: useSupabase ? "supabase" : "local",
 };
}

module.exports = { processImages };
