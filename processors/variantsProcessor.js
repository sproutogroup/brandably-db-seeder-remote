const { extractSizeId, writeCSV } = require("../lib/utils");

async function processVariants(
 data,
 modelToProductId,
 colorLookup,
 sizeLookup,
 serToPattern,
 patternToId,
 dataDir
) {
 console.log("\n🔄 Processing product variants...");

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

  // Map ItemCode to variantId for image processing
  if (row.ItemCode) {
   skuToVariantId.set(String(row.ItemCode), variantId);
  }

  variants.push({
   id: variantId,
   sku: row.ItemCode,
   price: price,
   stock: stock,
   color_id: colorId,
   size_id: sizeId,
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
