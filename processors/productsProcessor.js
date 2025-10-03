const { writeCSV } = require("../lib/utils");

async function processProducts(data, categoryLookup, brandLookup, dataDir) {
 console.log("\n🔄 Processing products...");

 const modelGroups = new Map();
 data.forEach((row) => {
  if (!modelGroups.has(row.ModelCode)) {
   modelGroups.set(row.ModelCode, row);
  }
 });

 const products = [];
 const modelToProductId = new Map();
 let productId = 1;

 modelGroups.forEach((firstRow, modelCode) => {
  products.push({
   id: productId,
   name: firstRow.ItemName,
   description: firstRow.LongDescription || null,
   base_price: firstRow.PriceOrig_1,
   is_active: true,
   category_id: categoryLookup[firstRow.MainCategory],
   brand_id: brandLookup[firstRow.Brand],
  });
  modelToProductId.set(modelCode, productId);
  productId++;
 });

 await writeCSV("products.csv", products, dataDir);
 console.log(`   ✓ Created ${products.length} products`);

 return { products, modelToProductId };
}

module.exports = { processProducts };
