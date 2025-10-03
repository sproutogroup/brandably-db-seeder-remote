const fs = require("fs").promises;
const XLSX = require("xlsx");
const config = require("../config/global-config");
const { buildImageMapping } = require("../lib/image-mapper");
const { processBrands } = require("../processors/brandsProcessor");
const { processColors } = require("../processors/colorsProcessor");
const {
 processCategories,
 processSubcategories,
} = require("../processors/categoriesProcessor");
const { processSizes } = require("../processors/sizesProcessor");
const { processBulkDiscounts } = require("../processors/discountsProcessor");
const { processProducts } = require("../processors/productsProcessor");
const { processVariants } = require("../processors/variantsProcessor");
const { printSummary } = require("../lib/print-summary");

async function processExcel(excelPath) {
 console.log("\n📂 Reading Excel file...");
 const workbook = XLSX.readFile(excelPath);
 const sheetName = workbook.SheetNames[0];
 const worksheet = workbook.Sheets[sheetName];
 const data = XLSX.utils.sheet_to_json(worksheet);
 console.log(`   ✓ Loaded ${data.length} rows from sheet '${sheetName}'`);

 // Build image mapping
 const imageMap = await buildImageMapping(config.IMAGES_DIR);

 // Ensure data directory exists
 await fs.mkdir(config.DATA_DIR, { recursive: true });

 // Process all entities
 const brands = await processBrands(data, config.DATA_DIR);
 const colors = await processColors(data, config.DATA_DIR);
 const categories = await processCategories(data, config.DATA_DIR);
 const subcategories = await processSubcategories(
  data,
  categories,
  config.DATA_DIR
 );
 const sizes = await processSizes(config.SIZES, config.DATA_DIR);

 // Create lookups
 const brandLookup = Object.fromEntries(brands.map((b) => [b.name, b.id]));
 const colorLookup = Object.fromEntries(colors.map((c) => [c.name, c.id]));
 const sizeLookup = Object.fromEntries(sizes.map((s) => [s.name, s.id]));
 const categoryLookup = Object.fromEntries(
  categories.map((c) => [c.name, c.id])
 );

 // Process bulk discounts
 const { plans, tiersData, serToPattern, patternToId, tierPatterns } =
  await processBulkDiscounts(data, config.QTY_PRICE_PAIRS, config.DATA_DIR);

 // Process products
 const { products, modelToProductId } = await processProducts(
  data,
  categoryLookup,
  brandLookup,
  config.DATA_DIR
 );

 // Process variants
 const { variants, variantsWithDiscounts, variantsWithImages } =
  await processVariants(
   data,
   modelToProductId,
   colorLookup,
   sizeLookup,
   serToPattern,
   patternToId,
   imageMap,
   config.DATA_DIR
  );

 // Print summary
 printSummary({
  brands,
  colors,
  categories,
  subcategories,
  sizes,
  plans,
  tiersData,
  products,
  variants,
  variantsWithDiscounts,
  variantsWithImages,
  tierPatterns,
  serToPattern,
 });
}

module.exports = { processExcel };
