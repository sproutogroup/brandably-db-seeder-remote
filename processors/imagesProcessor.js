const { writeCSV } = require("../lib/utils");

async function processImages(imageMap, skuToVariantId, dataDir) {
 console.log("\n🖼️  Processing product images...");

 const images = [];
 let imageId = 1;
 let totalImages = 0;
 let variantsWithImages = 0;

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
  filenames.forEach((filename) => {
   const fileUrl = `/images/products/${filename}`;

   images.push({
    id: imageId,
    file_name: filename,
    file_url: fileUrl,
    is_cover: filename.includes("__S_0") ? true : false,
    product_variant: variantId,
   });

   imageId++;
   totalImages++;
  });
 }

 variantsWithImages = variantsWithImageSet.size;

 await writeCSV("product_images.csv", images, dataDir);

 console.log(`   ✓ Created ${totalImages} product images`);
 console.log(`   ✓ ${variantsWithImages} variants have images`);

 return { images, totalImages, variantsWithImages };
}

module.exports = { processImages };
