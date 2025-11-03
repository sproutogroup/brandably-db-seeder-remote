const { writeCSV } = require("../lib/utils");

async function processProductVariantsPrintOptionsJunction(
 main,
 positionsData,
 skuToVariantId,
 techniqueNameToId,
 printOptions,
 printCodeToOptionId,
 printPositionCodeToId,
 dataDir
) {
 console.log(
  "\n🔄 Processing variant print options junction (defaults only)..."
 );

 const variantPrintOptions = [];
 let skippedCount = 0;
 let processedCount = 0;
 const missingVariants = new Set();
 const missingPrintOptions = new Set();
 const missingPositions = new Set();
 const noDefaultFound = new Set();

 // ✅ Prevent duplicates like (variant, option, position)
 const seenCombinations = new Set();

 // 🔍 Create a lookup map: ItemCode -> default settings
 const defaultsMap = new Map();
 main.forEach((row) => {
  const itemCode = String(row.ItemCode || "").trim();
  if (itemCode) {
   defaultsMap.set(itemCode, {
    technique: String(row.DefaultPrintTechnique || "").trim(),
    code: String(row.DefaultPrintCode || "").trim(),
    location: String(row.DefaultPrintLoc || "")
     .trim()
     .toLowerCase(),
   });
  }
 });

 positionsData.forEach((row) => {
  const itemCode = String(row.ItemCode || "").trim();
  const positionCode = String(row.PrintPositionCode || "")
   .trim()
   .toLowerCase();
  const techniqueCode = String(row.PrintTechnique || "").trim();
  const printCode = String(row.PrintCode || "").trim();

  // Get default settings for this item
  const defaults = defaultsMap.get(itemCode);

  if (!defaults) {
   skippedCount++;
   noDefaultFound.add(itemCode);
   return;
  }

  // ✅ Check if this row matches the default configuration
  const isDefault =
   techniqueCode === defaults.technique &&
   printCode === defaults.code &&
   positionCode === defaults.location;

  if (!isDefault) {
   // Skip non-default configurations
   return;
  }

  // Process all print options for this default configuration
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

  if (!variantId) missingVariants.add(itemCode);
  if (!printOptionIds.length) missingPrintOptions.add(printCode);
  if (!positionId) missingPositions.add(positionCode);

  if (!variantId || !printOptionIds.length || !positionId) {
   skippedCount++;
   return;
  }

  // Add all matching print options for this default configuration
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
  `   ✓ Created ${variantPrintOptions.length} default variant print options`
 );
 console.log(`   ✓ Processed ${processedCount} unique default mappings`);

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
  if (noDefaultFound.size > 0) {
   console.log(`     - ${noDefaultFound.size} items with no default config`);
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
