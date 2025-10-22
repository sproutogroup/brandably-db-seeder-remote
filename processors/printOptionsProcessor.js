const { writeCSV } = require("../lib/utils");

async function processPrintOptions(
 data,
 printTechniques,
 printCodeToPlanId,
 countToId,
 areaRangeToId,
 dataDir
) {
 console.log("\n🔄 Processing print options...");

 // Create a map of print technique name to ID
 const techniqueNameToId = new Map();
 printTechniques.forEach((technique) => {
  techniqueNameToId.set(technique.name, technique.id);
 });

 const uniquePrintOptions = new Map();

 data.forEach((row) => {
  if (!row.PrintCode || !row.PrintTechnique) return;

  const baseName = row.PrintCode;
  const techniqueId = techniqueNameToId.get(row.PrintTechnique);
  const planId = printCodeToPlanId.get(row.PrintCode);

  // Determine print area ID
  let printAreaId = null;
  if (
   row.PrintArea &&
   row.PrintAreaFromCM2 !== undefined &&
   row.PrintAreaToCM2 !== undefined
  ) {
   const areaKey = `${row.PrintAreaFromCM2}-${row.PrintAreaToCM2}`;
   printAreaId = areaRangeToId.get(areaKey);
  }

  // Get color count ID
  const colorCount = row.NrOfColors;
  const colorCountId = countToId.get(colorCount);

  // Build unique key based on ALL differentiating factors
  const uniqueKey = `${baseName}_${colorCount}_${printAreaId}`;

  // Build display name based on what varies
  let displayName = baseName;

  // Add area to name if present
  if (printAreaId && row.PrintAreaFromCM2 && row.PrintAreaToCM2) {
   displayName = `${baseName} (${row.PrintAreaFromCM2}cm2 - ${row.PrintAreaToCM2}cm2)`;
  }

  // Add color count to name if > 1
  if (colorCount > 1) {
   if (printAreaId) {
    displayName = `${baseName} (${colorCount} colors, ${row.PrintAreaFromCM2}cm2 - ${row.PrintAreaToCM2}cm2)`;
   } else {
    displayName = `${baseName} (${colorCount} colors)`;
   }
  }

  // Only add if this exact combination doesn't exist
  if (!uniquePrintOptions.has(uniqueKey)) {
   uniquePrintOptions.set(uniqueKey, {
    name: displayName,
    baseName: baseName,
    moq: row.MOQPrintOrder,
    colorCountId: colorCountId,
    printAreaId: printAreaId,
    printTechniqueId: techniqueId,
    printBulkDiscountPlanId: planId,
   });
  }
 });

 const printOptions = Array.from(uniquePrintOptions.values()).map(
  (item, index) => ({
   id: index + 1,
   name: item.name,
   minimum_order_quantity: item.moq,
   color_count_id: item.colorCountId,
   print_area_id: item.printAreaId,
   print_technique_id: item.printTechniqueId,
   print_bulk_discount_plan_id: item.printBulkDiscountPlanId,
  })
 );

 // Create lookup: Original PrintCode -> PrintOptionId
 const printCodeToOptionId = new Map();
 uniquePrintOptions.forEach((value, key) => {
  const option = printOptions.find((opt) => opt.name === value.name);
  if (option) {
   printCodeToOptionId.set(value.baseName, option.id);
  }
 });

 await writeCSV("print_options.csv", printOptions, dataDir);
 console.log(`   ✓ Created ${printOptions.length} print options`);

 return { printOptions, printCodeToOptionId };
}

module.exports = {
 processPrintOptions,
};
