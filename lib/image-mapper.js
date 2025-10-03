const fs = require("fs").promises;

// Build image mapping: ItemCode -> image filename
async function buildImageMapping(imagesDir) {
 console.log("\n🖼️  Processing images...");

 try {
  const imageFiles = await fs.readdir(imagesDir);
  const imageMap = new Map();
  let mappedCount = 0;

  imageFiles.forEach((filename) => {
   // Check if file has __ separator
   if (!filename.includes("__")) return;

   // Extract ItemCode (before first __)
   const itemCode = filename.split("__")[0];

   // Check if this is an S_0 image
   if (filename.includes("__S_0")) {
    imageMap.set(itemCode, filename);
    mappedCount++;
   }
  });

  console.log(`   ✓ Found ${imageFiles.length} total image files`);
  console.log(`   ✓ Mapped ${mappedCount} S_0 images to ItemCodes`);

  return imageMap;
 } catch (err) {
  console.log(`   ⚠ Could not read images folder: ${err.message}`);
  console.log(`   → Continuing without images...`);
  return new Map();
 }
}

module.exports = {
 buildImageMapping,
};
