const { writeCSV } = require("../lib/utils");

async function processSizes(sizes, dataDir) {
 console.log("\n🔄 Creating sizes...");

 await writeCSV("product_sizes.csv", sizes, dataDir);
 console.log(`   ✓ Created ${sizes.length} sizes`);

 return sizes;
}

module.exports = { processSizes };
