const { writeCSV } = require("../lib/utils");

async function processProducts(
 data,
 categoryLookup,
 subcategoryLookup,
 brandLookup,
 supplierLookup,
 dataDir
) {
 console.log("\n🔄 Processing products...");

 const modelGroups = new Map();
 const supplier = supplierLookup.find((s) => s.id === 1);

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
   model_code: modelCode,
   name: firstRow.ItemName,
   description: firstRow.LongDescription || null,
   base_price: firstRow.PriceOrig_1,
   is_active: true,
   category_id: categoryLookup[firstRow.MainCategory],
   subcategory_id: subcategoryLookup[firstRow.SubCategory],
   brand_id: brandLookup[firstRow.Brand],
   supplier: supplier.id,
  });
  modelToProductId.set(modelCode, productId);
  productId++;
 });

 await writeCSV("products.csv", products, dataDir);
 console.log(`   ✓ Created ${products.length} products`);

 return { products, modelToProductId };
}

module.exports = { processProducts };
