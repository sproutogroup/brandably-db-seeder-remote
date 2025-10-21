const { writeCSV } = require("../lib/utils");
const { getFileSize } = require("../services/upload-to-supabase");
const { calculateChecksum } = require("../services/upload-to-supabase");
const { uploadToSupabase } = require("../services/upload-to-supabase");
const path = require("path");

async function processImages(
 imageMap,
 skuToVariantId,
 dataDir,
 imagesSourceDir
) {
 console.log("\n🖼️  Processing product images...");
 const images = [];
 let imageId = 1;
 let totalImages = 0;
 let variantsWithImages = 0;
 let uploadedCount = 0;
 let failedCount = 0;
 let skippedCount = 0;

 // Track which variants have images
 const variantsWithImageSet = new Set();

 const lowercaseSkuToVariantId = new Map(
  Array.from(skuToVariantId, ([key, value]) => [key.toLowerCase(), value])
 );

 // Iterate through imageMap (ItemCode -> array of filenames)
 for (const [itemCode, filenames] of imageMap.entries()) {
  const variantId = lowercaseSkuToVariantId.get(itemCode.toLowerCase());

  if (!variantId) {
   console.log(`   ⚠ Warning: No variant found for ItemCode: ${itemCode}`);
   continue;
  }

  // Add to tracking set
  variantsWithImageSet.add(variantId);

  // Process each image for this ItemCode
  for (const filename of filenames) {
   const localFilePath = path.join(imagesSourceDir, filename);
   const isCover = filename.includes("__S_0");

   // Initialize image object with default values
   const imageObj = {
    id: imageId,
    file_name: filename,
    file_url: `/images/products/${filename}`, // Fallback local URL
    is_cover: isCover,
    product_variant: variantId,
    supabase_path: null,
    upload_status: "pending",
    uploaded_at: null,
    file_size: null,
    upload_error: null,
    checksum: null,
   };

   // Get file metadata
   imageObj.file_size = await getFileSize(localFilePath);
   imageObj.checksum = await calculateChecksum(localFilePath);

   // Upload to Supabase
   console.log(`   📤 Uploading: ${filename}...`);
   const uploadResult = await uploadToSupabase(
    localFilePath,
    filename,
    itemCode
   );

   if (uploadResult.success) {
    imageObj.file_url = uploadResult.publicUrl;
    imageObj.supabase_path = uploadResult.storagePath;
    imageObj.upload_status = uploadResult.skipped ? "skipped" : "uploaded";
    imageObj.uploaded_at = uploadResult.uploadedAt;

    if (uploadResult.skipped) {
     skippedCount++;
     console.log(`   ⏭️  Skipped (already exists): ${filename}`);
    } else {
     uploadedCount++;
     console.log(`   ✅ Success: ${filename}`);
    }
   } else {
    imageObj.upload_status = "failed";
    imageObj.upload_error = uploadResult.error;
    failedCount++;
    console.log(`   ❌ Failed: ${filename} - ${uploadResult.error}`);
   }

   images.push(imageObj);
   imageId++;
   totalImages++;
  }
 }

 variantsWithImages = variantsWithImageSet.size;

 await writeCSV("product_images.csv", images, dataDir);

 console.log(`\n📊 Image Processing Summary:`);
 console.log(`   ✓ Total images processed: ${totalImages}`);
 console.log(`   ✓ Successfully uploaded: ${uploadedCount}`);
 console.log(`   ✓ Skipped (already exist): ${skippedCount}`);
 console.log(`   ✓ Failed uploads: ${failedCount}`);
 console.log(`   ✓ Variants with images: ${variantsWithImages}`);

 return {
  images,
  totalImages,
  variantsWithImages,
  uploadedCount,
  skippedCount,
  failedCount,
 };
}

module.exports = { processImages };
