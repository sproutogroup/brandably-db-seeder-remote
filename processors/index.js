const fs = require("fs").promises;
const path = require("path");
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
const { processPrintTechniques } = require("./printTechniquesProcessor");
const { processPrintTechniqueTypes } = require("./printTechniqueTypeProcessor");
const { processPrintBulkDiscounts } = require("./printDiscountsProcessor");
const { processPrintOptions } = require("./printOptionsProcessor");
const {
 processProductVariantsPrintOptionsJunction,
} = require("./productVariantsPrintOptionsJunctionProcessor");
const { processPrintPositions } = require("./printPositionsProcessor");
const { processColorCounts } = require("./colorCountsProcessor");
const { processPrintAreas } = require("./printAreasProcessor");

const getExcelDataJson = (paths) => {
 const sheets = {};

 paths.forEach((filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const fileName = path.basename(filePath, path.extname(filePath));
  sheets[`${fileName}Sheet`] = {
   name: fileName,
   data: data,
  };
 });

 return sheets;
};

async function processExcel(excelPaths) {
 console.log("\n📂 Reading Excel file...");
 const {
  mainSheet: { name: mainName, data: main },
  printingSheet: { name: printingName, data: printing },
  positionsSheet: { name: positionsName, data: positions },
 } = getExcelDataJson(excelPaths);

 console.log(`   ✓ Loaded ${main.length} rows from sheet '${mainName}'`);
 console.log(
  `   ✓ Loaded ${printing.length} rows from sheet '${printingName}'`
 );
 console.log(
  `   ✓ Loaded ${positions.length} rows from sheet '${positionsName}'`
 );

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
 const usersRolesJunction = await processUsersRolesJunction(
  config.USER_ROLES,
  config.DATA_DIR
 );
 const rolesPermissionsJunction = await processRolesPermissionsJunction(
  config.ROLE_PERMISSIONS,
  config.DATA_DIR
 );

 const brands = await processBrands(main, config.DATA_DIR);
 const colors = await processColors(main, config.DATA_DIR);
 const categories = await processCategories(main, config.DATA_DIR);
 const subcategories = await processSubcategories(
  main,
  categories,
  config.DATA_DIR
 );
 const sizes = await processSizes(config.SIZES, config.DATA_DIR);
 const suppliers = await processSuppliers(config.SUPPLIERS, config.DATA_DIR);

 const printTechniquesTypes = await processPrintTechniqueTypes(
  printing,
  config.DATA_DIR
 );

 const { printTechniques, techniqueNameToId } = await processPrintTechniques(
  printing,
  printTechniquesTypes,
  config.DATA_DIR
 );

 const { colorCounts, countToId } = await processColorCounts(
  printing,
  config.DATA_DIR
 );

 const { printAreas, areaRangeToId } = await processPrintAreas(
  printing,
  config.DATA_DIR
 );

 // Process print bulk discounts BEFORE print options (needs to come first)
 const {
  plans: printPlans,
  tiersData: printTiersData,
  printCodeToPattern,
  patternToId: printPatternToId,
  tierPatterns: printTierPatterns,
  printCodeToPlanId,
 } = await processPrintBulkDiscounts(printing, config.DATA_DIR);

 // Process print options - now returns both array and lookup
 const { printOptions, printCodeToOptionId } = await processPrintOptions(
  printing,
  techniqueNameToId,
  printCodeToPlanId,
  countToId,
  areaRangeToId,
  config.DATA_DIR
 );

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
  await processBulkDiscounts(main, config.QTY_PRICE_PAIRS, config.DATA_DIR);

 // Process products
 const { products, modelToProductId } = await processProducts(
  main,
  categoryLookup,
  subcategoryLookup,
  brandLookup,
  suppliers,
  config.DATA_DIR
 );

 const { printPositions, printPositionCodeToId } = await processPrintPositions(
  positions,
  config.DATA_DIR
 );

 // Process variants
 const { variants, variantsWithDiscounts, skuToVariantId } =
  await processVariants(
   main,
   modelToProductId,
   colorLookup,
   sizeLookup,
   serToPattern,
   patternToId,
   printOptions,
   printPositions,
   config.DATA_DIR
  );

 const productVariantsPrintOptionsJunction =
  await processProductVariantsPrintOptionsJunction(
   positions,
   skuToVariantId,
   techniqueNameToId,
   printOptions,
   printCodeToOptionId,
   printPositionCodeToId, // Just the lookup
   config.DATA_DIR
  );

 // Process product images
 const { totalImages, variantsWithImages } = await processImages(
  imageMap,
  skuToVariantId,
  config.DATA_DIR,
  config.IMAGES_DIR,
  true
 );

 // Print summary
 printSummary({
  users,
  roles,
  permissions,
  usersRolesJunction,
  rolesPermissionsJunction,
  productVariantsPrintOptionsJunction,
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
  printTechniquesTypes,
  printTechniques,
  printPlans,
  printPositions,
  printOptions,
  colorCounts,
  printAreas,
 });
}

module.exports = { processExcel };
