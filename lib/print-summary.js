function printSummary(stats) {
 console.log("\n" + "=".repeat(60));
 console.log("✅ CSV FILES CREATED:");
 console.log("=".repeat(60));

 // RBAC files
 console.log("   RBAC:");
 console.log("   1. users.csv");
 console.log("   2. roles.csv");
 console.log("   3. permissions.csv");
 console.log("   4. user_roles.csv");
 console.log("   5. role_permissions.csv");

 // Product files
 console.log("\n   Products:");
 console.log("   6. product_brands.csv");
 console.log("   7. product_colors.csv");
 console.log("   8. product_categories.csv");
 console.log("   9. product_subcategories.csv");
 console.log("  10. product_sizes.csv");
 console.log("  11. product_suppliers.csv");
 console.log("  12. bulk_discount_plans.csv");
 console.log("  13. bulk_discount_tiers.csv");
 console.log("  14. products.csv");
 console.log("  15. product_variants.csv");
 console.log("  16. product_images.csv");

 // Print files
 console.log("  17. print_technique_types.csv");
 console.log("  18. print_techniques.csv");
 console.log("  19. print_bulk_discount_plans.csv");
 console.log("  20. print_bulk_discount_tiers.csv");
 console.log("  21. print_positions.csv");
 console.log("  22. color_counts.csv");
 console.log("  23. print_areas.csv");
 console.log("  24. print_options.csv");
 console.log("  25. product_variants_print_options_junction.csv");

 console.log(`\n📊 SUMMARY:`);

 // RBAC stats
 console.log("\n   🔐 RBAC:");
 console.log(`   - ${stats.users.length} users`);
 console.log(`   - ${stats.roles.length} roles`);
 console.log(`   - ${stats.permissions.length} permissions`);
 console.log(`   - ${stats.usersRolesJunction.length} user-role assignments`);
 console.log(
  `   - ${stats.rolesPermissionsJunction.length} role-permission assignments`
 );

 // Product stats
 console.log("\n   📦 Products:");
 console.log(`   - ${stats.brands.length} brands`);
 console.log(`   - ${stats.colors.length} colors`);
 console.log(`   - ${stats.categories.length} categories`);
 console.log(`   - ${stats.subcategories.length} subcategories`);
 console.log(`   - ${stats.sizes.length} sizes`);
 console.log(`   - ${stats.suppliers.length} suppliers`);
 console.log(`   - ${stats.plans.length} bulk discount plans`);
 console.log(`   - ${stats.tiersData.length} bulk discount tiers`);
 console.log(`   - ${stats.products.length} products`);
 console.log(`   - ${stats.variants.length} variants`);
 console.log(`   - ${stats.variantsWithDiscounts} variants with discounts`);
 console.log(`   - ${stats.totalImages} product images`);
 console.log(
  `   - ${stats.variantsWithImages} variants with images (${(
   (stats.variantsWithImages / stats.variants.length) *
   100
  ).toFixed(1)}%)`
 );

 // Print Stats
 console.log("\n   🖼️ Printing:");
 console.log(
  `   - ${stats.printTechniquesTypes.length} print techniques types,`
 );
 console.log(`   - ${stats.printTechniques.length} print techniques,`);
 console.log(`   - ${stats.printPlans.length} print plans,`);
 console.log(`   - ${stats.printPositions.length} print positions,`);
 console.log(`   - ${stats.printOptions.length} print options,`);
 console.log(`   - ${stats.colorCounts.length} color counts,`);
 console.log(`   - ${stats.printAreas.length} print areas,`);
 console.log(
  `   - ${stats.productVariantsPrintOptionsJunction.length} product_variants-print_options assignments`
 );

 // Calculate average images per variant
 if (stats.variantsWithImages > 0) {
  const avgImagesPerVariant = (
   stats.totalImages / stats.variantsWithImages
  ).toFixed(1);
  console.log(
   `   - Avg images per variant (with images): ${avgImagesPerVariant}`
  );
 }

 console.log(
  `   - Avg variants/product: ${(
   stats.variants.length / stats.products.length
  ).toFixed(1)}`
 );

 // Show role breakdown
 console.log(`\n🔍 RBAC BREAKDOWN:`);
 stats.roles.forEach((role) => {
  const permCount = stats.rolesPermissionsJunction.filter(
   (rp) => rp.role_id === role.id
  ).length;
  const userCount = stats.usersRolesJunction.filter(
   (ur) => ur.role_id === role.id
  ).length;
  console.log(
   `   - ${role.name}: ${permCount} permissions, ${userCount} user(s)`
  );
 });

 // Show top discount patterns
 console.log(`\n💰 TOP 3 DISCOUNT PATTERNS:`);
 const patternCounts = new Map();
 stats.serToPattern.forEach((pattern) => {
  patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
 });

 const topPatterns = Array.from(patternCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);

 topPatterns.forEach(([pattern, count], idx) => {
  const tiers = JSON.parse(pattern);
  const tierDisplay = tiers.map(([q, p]) => `${q}@${p}`).join(", ");
  console.log(`   ${idx + 1}. ${count} variants: [${tierDisplay}]`);
 });

 console.log("\n" + "=".repeat(60));
}

module.exports = { printSummary };
