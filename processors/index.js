const fs = require("fs").promises;
const XLSX = require("xlsx");
const config = require("../config/global-config");
const { buildImageMapping } = require("../lib/image-mapper");
const { processUsers } = require("./usersProcessor");
const { processRoles } = require("./rolesProcessor");
const { processPermissions } = require("./permissionsProcessor");
const { processUsersRolesJunction } = require("./usersRolesJunctionProcessor");
const {
 processRolesPermissionsJunction,
} = require("./rolesPermissionsJunctionProcessor");
const { processBrands } = require("./brandsProcessor");
const { processColors } = require("./colorsProcessor");
const {
 processCategories,
 processSubcategories,
} = require("./categoriesProcessor");
const { processSizes } = require("./sizesProcessor");
const { processBulkDiscounts } = require("./discountsProcessor");
const { processProducts } = require("./productsProcessor");
const { processVariants } = require("./variantsProcessor");
const { processImages } = require("./imagesProcessor");
const { printSummary } = require("../lib/print-summary");
const { processSuppliers } = require("./suppliersProcessor");

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
 const users = await processUsers(config.USERS, config.DATA_DIR);
 const roles = await processRoles(config.ROLES, config.DATA_DIR);
 const permissions = await processPermissions(
  config.PERMISSIONS,
  config.DATA_DIR
 );
 const userRoles = await processUsersRolesJunction(
  config.USER_ROLES,
  config.DATA_DIR
 );
 const rolePermissions = await processRolesPermissionsJunction(
  config.ROLE_PERMISSIONS,
  config.DATA_DIR
 );

 const brands = await processBrands(data, config.DATA_DIR);
 const colors = await processColors(data, config.DATA_DIR);
 const categories = await processCategories(data, config.DATA_DIR);
 const subcategories = await processSubcategories(
  data,
  categories,
  config.DATA_DIR
 );
 const sizes = await processSizes(config.SIZES, config.DATA_DIR);
 const suppliers = await processSuppliers(config.SUPPLIERS, config.DATA_DIR);

 // Create lookups
 const brandLookup = Object.fromEntries(brands.map((b) => [b.name, b.id]));
 const colorLookup = Object.fromEntries(colors.map((c) => [c.name, c.id]));
 const sizeLookup = Object.fromEntries(sizes.map((s) => [s.name, s.id]));
 const categoryLookup = Object.fromEntries(
  categories.map((c) => [c.name, c.id])
 );
 const subcategoryLookup = Object.fromEntries(
  subcategories.map((c) => [c.name, c.id])
 );

 // Process bulk discounts
 const { plans, tiersData, serToPattern, patternToId, tierPatterns } =
  await processBulkDiscounts(data, config.QTY_PRICE_PAIRS, config.DATA_DIR);

 // Process products
 const { products, modelToProductId } = await processProducts(
  data,
  categoryLookup,
  subcategoryLookup,
  brandLookup,
  suppliers,
  config.DATA_DIR
 );

 // Process variants
 const { variants, variantsWithDiscounts, skuToVariantId } =
  await processVariants(
   data,
   modelToProductId,
   colorLookup,
   sizeLookup,
   serToPattern,
   patternToId,
   config.DATA_DIR
  );

 // Process product images
 const { totalImages, variantsWithImages } = await processImages(
  imageMap,
  skuToVariantId,
  config.DATA_DIR
 );

 // Print summary
 printSummary({
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  brands,
  colors,
  categories,
  subcategories,
  sizes,
  suppliers,
  plans,
  tiersData,
  products,
  variants,
  variantsWithDiscounts,
  variantsWithImages,
  totalImages,
  tierPatterns,
  serToPattern,
 });
}

module.exports = { processExcel };
