const fs = require("fs").promises;

// Build image mapping: ItemCode -> array of image filenames
async function buildImageMapping(imagesDir) {
 console.log("\n🖼️  Scanning images directory...");

 try {
  const imageFiles = await fs.readdir(imagesDir);
  const imageMap = new Map();
  let mappedCount = 0;

  imageFiles.forEach((filename) => {
   // Check if file has __ separator
   if (!filename.includes("__")) return;

   // Extract ItemCode (before first __)
   const itemCode = filename.split("__")[0];

   // Add to array for this ItemCode
   if (!imageMap.has(itemCode)) {
    imageMap.set(itemCode, []);
   }
   imageMap.get(itemCode).push(filename);
   mappedCount++;
  });

  console.log(`   ✓ Found ${imageFiles.length} total image files`);
  console.log(
   `   ✓ Mapped ${mappedCount} images to ${imageMap.size} ItemCodes`
  );

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
