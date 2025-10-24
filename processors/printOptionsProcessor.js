const { writeCSV } = require("../lib/utils");

async function processPrintOptions(
 data,
 techniqueNameToId,
 printCodeToPlanId,
 countToId,
 areaRangeToId,
 dataDir
) {
 console.log("\n🔄 Processing print options...");

 const uniquePrintOptions = new Map();

 data.forEach((row, i) => {
  if (!row.PrintCode || !row.PrintTechnique) return;

  const baseName = row.PrintCode;
  const colorCount = row.NrOfColors;
  const techniqueId = techniqueNameToId.get(row.PrintTechnique);
  let printAreaId = null;
  let colorCountId = null;

  // Determine print area ID
  if (
   row.PrintArea &&
   row.PrintAreaFromCM2 !== undefined &&
   row.PrintAreaToCM2 !== undefined
  ) {
   const areaKey = `${row.PrintAreaFromCM2}-${row.PrintAreaToCM2}`;
   printAreaId = areaRangeToId.get(areaKey);
  }

  // Get color count ID
  if (colorCount) {
   colorCountId = countToId.get(colorCount);
  }

  // Build display name based on what varies
  let uniquePrintCode = baseName;

  // Add area to name if present
  if (printAreaId) {
   uniquePrintCode = `${baseName} (${row.PrintAreaFromCM2}cm2 - ${row.PrintAreaToCM2}cm2)`;
  }

  // Add color count to name if > 1
  if (colorCount) {
   if (printAreaId) {
    uniquePrintCode = `${baseName} (${colorCount} colors, ${row.PrintAreaFromCM2}cm2 - ${row.PrintAreaToCM2}cm2)`;
   } else {
    uniquePrintCode = `${baseName} (${colorCount} color${
     colorCount > 1 ? "s" : ""
    })`;
   }
  }

  const planId = printCodeToPlanId.get(uniquePrintCode);

  // Build unique key based on ALL differentiating factors
  const uniqueKey = `${uniquePrintCode}_${colorCount}_${printAreaId}`;

  // Only add if this exact combination doesn't exist
  if (!uniquePrintOptions.has(uniqueKey)) {
   uniquePrintOptions.set(uniqueKey, {
    name: uniquePrintCode,
    baseName,
    moq: row.MOQPrintOrder,
    colorCountId: colorCountId,
    printAreaId: printAreaId,
    printTechniqueId: techniqueId,
    printBulkDiscountPlanId: planId,
   });
  }
 });

 const _printOptions = Array.from(uniquePrintOptions.values()).map(
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

 const printOptions = Array.from(uniquePrintOptions.values()).map(
  (item, index) => ({
   id: index + 1,
   name: item.name,
   base_name: item.baseName,
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
  const option = _printOptions.find((opt) => opt.name === value.name);
  if (option) {
   printCodeToOptionId.set(value.name, option.id);
  }
 });

 await writeCSV("print_options.csv", _printOptions, dataDir);
 console.log(`   ✓ Created ${_printOptions.length} print options`);

 return { printOptions, printCodeToOptionId };
}

module.exports = {
 processPrintOptions,
};
