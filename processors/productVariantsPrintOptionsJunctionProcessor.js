const { writeCSV } = require("../lib/utils");

async function processProductVariantsPrintOptionsJunction(
 positionsData,
 skuToVariantId,
 techniqueNameToId,
 printOptions,
 printCodeToOptionId,
 printPositionCodeToId,
 dataDir
) {
 console.log("\n🔄 Processing variant print options junction...");

 const variantPrintOptions = [];
 let skippedCount = 0;
 let processedCount = 0;

 const missingVariants = new Set();
 const missingPrintOptions = new Set();
 const missingPositions = new Set();

 // ✅ prevent duplicates like (variant, option, position)
 const seenCombinations = new Set();

 positionsData.forEach((row, i) => {
  const itemCode = String(row.ItemCode || "");
  const positionCode = String(row.PrintPositionCode || "");

  const printOptionsPerTechnique = getPrintOptionsByTechnique(
   row,
   printOptions,
   techniqueNameToId
  );

  const printOptionIds = printOptionsPerTechnique
   .map((o) => printCodeToOptionId.get(o.name))
   .filter(Boolean);

  const variantId = skuToVariantId.get(itemCode);
  const positionId = printPositionCodeToId.get(positionCode);

  if (!variantId) missingVariants.add(row.ItemCode);
  if (!printOptionIds.length) missingPrintOptions.add(row.PrintCode);
  if (!positionId) missingPositions.add(row.PrintPositionCode);

  if (!variantId || !printOptionIds.length || !positionId) {
   skippedCount++;
   return;
  }

  printOptionIds.forEach((optionId) => {
   const comboKey = `${variantId}-${optionId}-${positionId}`;
   if (seenCombinations.has(comboKey)) return; // skip duplicates
   seenCombinations.add(comboKey);

   variantPrintOptions.push({
    product_variant_id: variantId,
    print_option_id: optionId,
    print_position_id: positionId,
   });

   processedCount++;
  });
 });

 await writeCSV(
  "product_variants_print_options_junction.csv",
  variantPrintOptions,
  dataDir
 );

 console.log(
  `   ✓ Created ${variantPrintOptions.length} variant print options`
 );
 console.log(`   ✓ Processed ${processedCount} unique mappings`);

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

function getPrintOptionsByTechnique(row, printOptions, techniqueNameToId) {
 const technique = row.PrintTechnique;
 const techniqueId = techniqueNameToId.get(technique);

 const baseName = row.PrintCode;

 const printOptionsByTechnique = printOptions.filter(
  (o) => o.print_technique_id === techniqueId
 );

 const singleOption = printOptionsByTechnique.find((o) => {
  return o.name === baseName;
 });

 let lastOptions = [];

 if (!singleOption) {
  lastOptions = printOptionsByTechnique.filter((o) => {
   return o.name.includes(baseName);
  });
 }

 return lastOptions.length > 0
  ? lastOptions
  : singleOption
  ? [singleOption]
  : printOptionsByTechnique;
}
