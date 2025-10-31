const { extractSizeId, writeCSV } = require("../lib/utils");

async function processVariants(
 data,
 modelToProductId,
 colorLookup,
 sizeLookup,
 serToPattern,
 patternToId,
 printOptions,
 positions,
 dataDir
) {
 console.log("\n🔄 Processing product variants...");

 // Create lookup maps for print options and positions
 const printOptionLookup = new Map();
 printOptions.forEach((option) => {
  printOptionLookup.set(option.base_name, option.id);
 });

 const printPositionLookup = new Map();
 positions.forEach((position) => {
  printPositionLookup.set(position.code.toLowerCase(), position.id);
 });

 const variants = [];
 const skuToVariantId = new Map(); // Track ItemCode -> variantId mapping
 let variantId = 1;
 let variantsWithDiscounts = 0;

 data.forEach((row) => {
  const productId = modelToProductId.get(row.ModelCode);
  const colorId = colorLookup[row.Color];
  const sizeId = extractSizeId(row.ItemCode, sizeLookup);
  const serValue = row.Ser;

  let bulkDiscountPlanId = null;
  if (serToPattern.has(serValue)) {
   const patternHash = serToPattern.get(serValue);
   bulkDiscountPlanId = patternToId.get(patternHash);
   variantsWithDiscounts++;
  }

  // Handle stock - convert "Out of stock" to 0
  let stock = 0;
  if (row.CurrentStock !== null && row.CurrentStock !== undefined) {
   if (String(row.CurrentStock).toLowerCase().includes("out of stock")) {
    stock = 0;
   } else {
    stock = parseInt(row.CurrentStock) || 0;
   }
  }

  // Handle price - default to 0 if not specified
  const price = row.PriceOrig_1 || 0;

  // Get print option ID from DefaultPrintCode
  const printOptionId = row.DefaultPrintCode
   ? printOptionLookup.get(row.DefaultPrintCode) || null
   : null;

  // Get print position ID from DefaultPrintLoc
  const printPositionId = row.DefaultPrintLoc
   ? printPositionLookup.get(row.DefaultPrintLoc) || null
   : null;

  // Parse MaxPrintAreaDefault (e.g., "150 x 150 mm" -> width: 150, height: 150, unit: "mm")
  let maxPrintWidth = null;
  let maxPrintHeight = null;
  let printUnit = null;
  if (row.MaxPrintAreaDefault) {
   // Match pattern: number x number unit (e.g., "150 x 150 mm")
   const match = String(row.MaxPrintAreaDefault).match(
    /(\d+)\s*x\s*(\d+)\s*([a-zA-Z]+)/i
   );
   if (match) {
    maxPrintWidth = parseInt(match[1]);
    maxPrintHeight = parseInt(match[2]);
    printUnit = match[3].toLowerCase(); // e.g., "mm", "cm", "inches"
   }
  }

  // Map ItemCode to variantId for image processing
  if (row.ItemCode) {
   skuToVariantId.set(String(row.ItemCode), variantId);
  }

  variants.push({
   id: variantId,
   sku: row.ItemCode,
   revised_sku: row["Revised SKU"],
   price: price * 2,
   stock: stock,
   color_id: colorId,
   size_id: sizeId,
   print_option: printOptionId,
   print_position: printPositionId,
   max_print_width: maxPrintWidth,
   max_print_height: maxPrintHeight,
   print_area_unit: printUnit,
   product_id: productId,
   bulk_discount_plan_id: bulkDiscountPlanId,
  });

  variantId++;
 });

 await writeCSV("product_variants.csv", variants, dataDir);

 console.log(`   ✓ Created ${variants.length} product variants`);
 console.log(`   ✓ ${variantsWithDiscounts} variants with bulk discounts`);

 return { variants, variantsWithDiscounts, skuToVariantId };
}

module.exports = { processVariants };
