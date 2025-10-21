const { writeCSV } = require("../lib/utils");

async function processProductVariantsPrintOptionsJunction(
 printingData,
 positionsData,
 skuToVariantId,
 printCodeToOptionId,
 printPositionCodeToId,
 dataDir
) {
 console.log("\n🔄 Processing variant print options junction...");

 const variantPrintOptions = [];
 let optionId = 1;
 let skippedCount = 0;
 let processedCount = 0;

 const missingVariants = new Set();
 const missingPrintOptions = new Set();
 const missingPositions = new Set();

 positionsData.forEach((row) => {
  const itemCode = String(row.ItemCode || "");
  const printCode = String(row.PrintCode || "");
  const positionCode = String(row.PrintPositionCode || "");

  const variantId = skuToVariantId.get(itemCode);
  const printOptionId = printCodeToOptionId.get(printCode);
  const positionId = printPositionCodeToId.get(positionCode);

  if (!variantId) missingVariants.add(row.ItemCode);
  if (!printOptionId) missingPrintOptions.add(row.PrintCode);
  if (!positionId) missingPositions.add(row.PrintPositionCode);

  if (!variantId || !printOptionId || !positionId) {
   skippedCount++;
   return;
  }

  variantPrintOptions.push({
   id: optionId++,
   product_variant_id: variantId,
   print_option_id: printOptionId,
   print_position_id: positionId,
  });

  processedCount++;
 });

 await writeCSV(
  "product_variants_print_options_junction.csv",
  variantPrintOptions,
  dataDir
 );

 console.log(
  `   ✓ Created ${variantPrintOptions.length} variant print options`
 );
 console.log(`   ✓ Processed ${processedCount} mappings`);

 if (skippedCount > 0) {
  console.log(`   ⚠ Skipped ${skippedCount} rows:`);
  if (missingVariants.size > 0) {
   console.log(`     - ${missingVariants.size} missing variants`);
  }
  if (missingPrintOptions.size > 0) {
   console.log(`     - ${missingPrintOptions.size} missing print options`);
  }
  if (missingPositions.size > 0) {
   console.log(`     - ${missingPositions.size} missing positions`);
  }
 }

 return variantPrintOptions;
}

module.exports = { processProductVariantsPrintOptionsJunction };
