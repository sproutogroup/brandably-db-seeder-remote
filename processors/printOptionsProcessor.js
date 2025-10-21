const { writeCSV } = require("../lib/utils");

async function processPrintOptions(
 data,
 printTechniques,
 printCodeToPlanId,
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

  const key = row.PrintCode;

  // Only add if not already processed
  if (!uniquePrintOptions.has(key)) {
   const techniqueId = techniqueNameToId.get(row.PrintTechnique);
   const planId = printCodeToPlanId.get(row.PrintCode);

   // Determine print area unit and values
   let printAreaFrom = null;
   let printAreaTo = null;
   let printAreaUnit = null;

   if (row.PrintArea && row.PrintAreaFromCM2 && row.PrintAreaToCM2) {
    printAreaFrom = row.PrintAreaFromCM2;
    printAreaTo = row.PrintAreaToCM2;
    printAreaUnit = "cm2";
   }

   uniquePrintOptions.set(key, {
    name: row.PrintCode,
    moq: row.MOQPrintOrder,
    colorCount: row.NrOfColors || 1,
    printAreaFrom,
    printAreaTo,
    printAreaUnit,
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
   no_of_colors: item.colorCount,
   print_area_from: item.printAreaFrom,
   print_area_to: item.printAreaTo,
   print_area_unit: item.printAreaUnit,
   print_technique_id: item.printTechniqueId, // Changed
   print_bulk_discount_plan_id: item.printBulkDiscountPlanId,
  })
 );

 // Create lookup: PrintCode -> PrintOptionId
 const printCodeToOptionId = new Map();
 uniquePrintOptions.forEach((value, key) => {
  const option = printOptions.find((opt) => opt.name === key);
  if (option) {
   printCodeToOptionId.set(key, option.id);
  }
 });

 await writeCSV("print_options.csv", printOptions, dataDir);

 console.log(`   ✓ Created ${printOptions.length} print options`);

 // Return both printOptions array and the lookup map
 return { printOptions, printCodeToOptionId };
}

module.exports = {
 processPrintOptions,
};
