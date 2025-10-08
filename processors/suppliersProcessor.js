const { writeCSV } = require("../lib/utils");

async function processSuppliers(suppliers, dataDir) {
 console.log("\n🔄 Creating suppliers...");

 await writeCSV("product_suppliers.csv", suppliers, dataDir);
 console.log(`   ✓ Created ${suppliers.length} suppliers`);

 return suppliers;
}

module.exports = { processSuppliers };
