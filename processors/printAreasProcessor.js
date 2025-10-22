const { writeCSV } = require("../lib/utils");

async function processPrintAreas(data, dataDir) {
 console.log("\n🔄 Processing print areas...");

 const uniqueAreas = new Map();

 data.forEach((row) => {
  // Only process rows that have print area information
  if (
   row.PrintArea &&
   row.PrintAreaFromCM2 !== undefined &&
   row.PrintAreaToCM2 !== undefined
  ) {
   const from = row.PrintAreaFromCM2;
   const to = row.PrintAreaToCM2;
   const unit = "cm2";

   // Create unique key based on from-to range
   const key = `${from}-${to}`;

   if (!uniqueAreas.has(key)) {
    uniqueAreas.set(key, {
     printAreaFrom: from,
     printAreaTo: to,
     printAreaUnit: unit,
    });
   }
  }
 });

 // Convert to array and sort by 'from' value
 const sortedAreas = Array.from(uniqueAreas.values()).sort(
  (a, b) => a.printAreaFrom - b.printAreaFrom
 );

 const printAreas = sortedAreas.map((area, index) => ({
  id: index + 1,
  print_area_from: area.printAreaFrom,
  print_area_to: area.printAreaTo,
  print_area_unit: area.printAreaUnit,
 }));

 // Create lookup: "from-to" -> id
 const areaRangeToId = new Map();
 printAreas.forEach((area) => {
  const key = `${area.print_area_from}-${area.print_area_to}`;
  areaRangeToId.set(key, area.id);
 });

 await writeCSV("print_areas.csv", printAreas, dataDir);
 console.log(`   ✓ Created ${printAreas.length} print areas`);

 return { printAreas, areaRangeToId };
}

module.exports = {
 processPrintAreas,
};
