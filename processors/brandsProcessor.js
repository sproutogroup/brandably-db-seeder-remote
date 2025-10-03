const { slugify, writeCSV } = require("../lib/utils");

async function processBrands(data, dataDir) {
 console.log("\n🔄 Processing brands...");

 const uniqueBrands = [
  ...new Set(data.map((row) => row.Brand).filter(Boolean)),
 ];

 const brands = uniqueBrands.map((name, idx) => ({
  id: idx + 1,
  name,
  slug: slugify(name),
 }));

 await writeCSV("product_brands.csv", brands, dataDir);
 console.log(`   ✓ Created ${brands.length} brands`);

 return brands;
}

module.exports = { processBrands };
