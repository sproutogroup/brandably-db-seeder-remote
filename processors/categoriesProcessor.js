const { slugify, writeCSV } = require("../lib/utils");

async function processCategories(data, dataDir) {
 console.log("\n🔄 Processing categories...");

 const uniqueCategories = [
  ...new Set(data.map((row) => row.MainCategory).filter(Boolean)),
 ];

 const categories = uniqueCategories.map((name, idx) => ({
  id: idx + 1,
  name,
  slug: slugify(name),
 }));

 await writeCSV("product_categories.csv", categories, dataDir);
 console.log(`   ✓ Created ${categories.length} categories`);

 return categories;
}

async function processSubcategories(data, categories, dataDir) {
 console.log("\n🔄 Processing subcategories...");

 const subcategoryPairs = new Map();
 data.forEach((row) => {
  if (row.MainCategory && row.SubCategory) {
   const key = `${row.MainCategory}|${row.SubCategory}`;
   if (!subcategoryPairs.has(key)) {
    subcategoryPairs.set(key, {
     main: row.MainCategory,
     sub: row.SubCategory,
    });
   }
  }
 });

 const categoryLookup = Object.fromEntries(
  categories.map((c) => [c.name, c.id])
 );

 const subcategories = Array.from(subcategoryPairs.values()).map(
  (pair, idx) => ({
   id: idx + 1,
   name: pair.sub,
   slug: slugify(pair.sub),
   parent_id: categoryLookup[pair.main],
  })
 );

 await writeCSV("product_subcategories.csv", subcategories, dataDir);
 console.log(`   ✓ Created ${subcategories.length} subcategories`);

 return subcategories;
}

module.exports = {
 processCategories,
 processSubcategories,
};
