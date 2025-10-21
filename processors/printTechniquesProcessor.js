const { writeCSV } = require("../lib/utils");

async function processPrintTechniques(data, techniqueTypes, dataDir) {
 console.log("\n🔄 Processing print techniques...");

 const typeNameToId = new Map();
 techniqueTypes.forEach((type) => {
  typeNameToId.set(type.name, type.id);
 });

 const uniqueTechniques = new Map();
 data.forEach((row) => {
  if (row.PrintTechnique && row.TechniqueType) {
   const key = `${row.PrintTechnique}|${row.TechniqueType}`;
   if (!uniqueTechniques.has(key)) {
    uniqueTechniques.set(key, {
     name: row.PrintTechnique,
     techniqueType: row.TechniqueType,
    });
   }
  }
 });

 const techniques = Array.from(uniqueTechniques.values()).map(
  (item, index) => ({
   id: index + 1,
   name: item.name,
   print_technique_type_id: typeNameToId.get(item.techniqueType),
  })
 );

 await writeCSV("print_techniques.csv", techniques, dataDir);
 console.log(`   ✓ Created ${techniques.length} print techniques`);

 return techniques;
}

module.exports = {
 processPrintTechniques,
};
