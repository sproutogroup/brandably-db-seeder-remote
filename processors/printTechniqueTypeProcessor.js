const { writeCSV } = require("../lib/utils");

async function processPrintTechniqueTypes(data, dataDir) {
 console.log("\n🔄 Processing print technique types...");

 const uniqueTypes = new Set();
 data.forEach((row) => {
  if (row.TechniqueType) {
   uniqueTypes.add(row.TechniqueType);
  }
 });

 const types = Array.from(uniqueTypes).map((name, index) => ({
  id: index + 1,
  name: name,
 }));

 await writeCSV("print_technique_types.csv", types, dataDir);
 console.log(`   ✓ Created ${types.length} print technique types`);

 return types;
}

module.exports = { processPrintTechniqueTypes };
