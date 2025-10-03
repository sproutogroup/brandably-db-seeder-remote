const { writeCSV } = require("../lib/utils");
const {
 extractSizeFromItemCode,
 extractSizeFromName,
 getBaseProductName,
} = require("../lib/sizes-processor-utils");

async function processSizes(items, dataDir) {
 console.log("\n🔄 Processing sizes from items...");

 // Group items by base product name (without size)
 const productGroups = {};

 items.forEach((item) => {
  // Try to extract size from ItemCode first, then from ItemName
  let sizeInfo = extractSizeFromItemCode(item.ItemCode);
  if (!sizeInfo) {
   sizeInfo = extractSizeFromName(item.ItemName);
  }

  const { baseName, baseCode } = getBaseProductName(
   item.ItemName,
   item.ItemCode
  );

  // Use baseName as the grouping key (the name without size)
  const groupKey = baseName;
  groupKey[0].toLowerCase() === "a" && console.log(groupKey);

  if (!productGroups[groupKey]) {
   productGroups[groupKey] = [];
  }

  productGroups[groupKey].push({
   item,
   sizeInfo,
   baseName,
   baseCode,
  });
 });

 // Create sizes array - only for products with multiple variants AND different sizes
 const uniqueSizes = new Map(); // Track unique value+unit combinations
 let sizeId = 1;

 Object.entries(productGroups).forEach(([groupKey, variants]) => {
  // Check if there are multiple variants with different sizes
  if (variants.length > 1) {
   // Collect all unique size values for this group
   const uniqueSizeValues = new Set();
   variants.forEach(({ sizeInfo }) => {
    if (sizeInfo) {
     uniqueSizeValues.add(`${sizeInfo.value}-${sizeInfo.unit}`);
    }
   });

   // Only process if there are actually different sizes (more than 1 unique size)
   if (uniqueSizeValues.size > 1) {
    variants.forEach(({ item, sizeInfo }) => {
     if (sizeInfo) {
      const sizeKey = `${sizeInfo.value}-${sizeInfo.unit}`;

      if (!uniqueSizes.has(sizeKey)) {
       uniqueSizes.set(sizeKey, {
        id: sizeId++,
        value: sizeInfo.value,
        unit: sizeInfo.unit,
       });
      }

      // console.log(
      //  `   ✓ ${item.ItemCode}: ${sizeInfo.display} (value: ${sizeInfo.value}, unit: ${sizeInfo.unit})`
      // );
     }
    });
   } else {
    // Multiple items but same size - not variants, skip
    // console.log(
    //  `   ℹ️ Skipping group ${groupKey}: ${
    //   variants.length
    //  } items with same size (${
    //   uniqueSizeValues.size > 0 ? Array.from(uniqueSizeValues)[0] : "no size"
    //  })`
    // );
   }
  } else if (variants.length === 1 && variants[0].sizeInfo) {
   // Single item with size - skip as it's not a variant
   // console.log(`   ℹ️ Skipping single item: ${variants[0].item.ItemCode}`);
  }
 });

 const sizes = Array.from(uniqueSizes.values());

 console.log(`\n   ✓ Found ${sizes.length} unique sizes`);

 if (sizes.length > 0) {
  await writeCSV("product_sizes.csv", sizes, dataDir);
  console.log(`   ✓ Created product_sizes.csv with ${sizes.length} entries`);
 } else {
  console.log(`   ⚠️ No size variants found - no CSV created`);
 }

 return sizes;
}

module.exports = { processSizes };
