function printSummary(stats) {
 console.log("\n" + "=".repeat(60));
 console.log("✅ CSV FILES CREATED:");
 console.log("=".repeat(60));
 console.log("   1. product_brands.csv");
 console.log("   2. product_colors.csv");
 console.log("   3. product_categories.csv");
 console.log("   4. product_subcategories.csv");
 console.log("   5. product_sizes.csv");
 console.log("   6. bulk_discount_plans.csv");
 console.log("   7. bulk_discount_tiers.csv");
 console.log("   8. products.csv");
 console.log("   9. product_variants.csv");

 console.log(`\n📊 SUMMARY:`);
 console.log(`   - ${stats.brands.length} brands`);
 console.log(`   - ${stats.colors.length} colors`);
 console.log(`   - ${stats.categories.length} categories`);
 console.log(`   - ${stats.subcategories.length} subcategories`);
 console.log(`   - ${stats.sizes.length} sizes`);
 console.log(`   - ${stats.plans.length} bulk discount plans`);
 console.log(`   - ${stats.tiersData.length} bulk discount tiers`);
 console.log(`   - ${stats.products.length} products`);
 console.log(`   - ${stats.variants.length} variants`);
 console.log(`   - ${stats.variantsWithDiscounts} variants with discounts`);
 console.log(
  `   - ${stats.variantsWithImages} variants with images (${(
   (stats.variantsWithImages / stats.variants.length) *
   100
  ).toFixed(1)}%)`
 );
 console.log(
  `   - Avg variants/product: ${(
   stats.variants.length / stats.products.length
  ).toFixed(1)}`
 );

 // Show top discount patterns
 console.log(`\n🔍 TOP 3 DISCOUNT PATTERNS:`);
 const patternCounts = new Map();
 stats.serToPattern.forEach((pattern) => {
  patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
 });

 const topPatterns = Array.from(patternCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);

 topPatterns.forEach(([pattern, count], idx) => {
  const tiers = JSON.parse(pattern);
  const tierDisplay = tiers.map(([q, p]) => `${q}@$${p}`).join(", ");
  console.log(`   ${idx + 1}. ${count} variants: [${tierDisplay}]`);
 });

 console.log("\n" + "=".repeat(60));
}

module.exports = { printSummary };
