const { writeCSV } = require("../lib/utils");

async function processBulkDiscounts(data, qtyPricePairs, dataDir) {
 console.log("\n🔄 Processing bulk discounts...");

 if (!data[0]?.Ser) {
  console.log("   ❌ Error: 'Ser' column not found!");
  return {
   plans: [],
   tiersData: [],
   serToPattern: new Map(),
   patternToId: new Map(),
  };
 }

 const tierPatterns = new Map();
 const serToPattern = new Map();

 data.forEach((row) => {
  const serValue = row.Ser;
  const tiers = [];

  qtyPricePairs.forEach(([qtyCol, priceCol]) => {
   const qty = row[qtyCol];
   const price = row[priceCol];

   if (qty != null && price != null && qty > 0) {
    tiers.push([qty, parseFloat(price)]);
   }
  });

  if (tiers.length === 0) return;

  tiers.sort((a, b) => a[0] - b[0]);
  const patternHash = JSON.stringify(tiers);

  if (!tierPatterns.has(patternHash)) {
   tierPatterns.set(patternHash, tiers);
  }

  serToPattern.set(serValue, patternHash);
 });

 console.log(`   ✓ Found ${tierPatterns.size} unique discount patterns`);
 console.log(`   ✓ Processing ${serToPattern.size} rows with discounts`);

 // Create bulk_discount_plans
 const patternToId = new Map();
 const plans = [];
 let planId = 1;

 tierPatterns.forEach((tiers, patternHash) => {
  plans.push({
   id: planId,
   name: `Bulk Discount Plan ${planId}`,
   discount_type: "fixed_price",
   is_active: true,
  });
  patternToId.set(patternHash, planId);
  planId++;
 });

 await writeCSV("bulk_discount_plans.csv", plans, dataDir);
 console.log(`   ✓ Created ${plans.length} bulk discount plans`);

 // Create bulk_discount_tiers
 const tiersData = [];
 let tierId = 1;

 tierPatterns.forEach((tiers, patternHash) => {
  const planId = patternToId.get(patternHash);
  tiers.forEach(([qty, price]) => {
   tiersData.push({
    id: tierId,
    bulk_discount_plan_id: planId,
    quantity: qty,
    value: price * 2,
   });
   tierId++;
  });
 });

 await writeCSV("bulk_discount_tiers.csv", tiersData, dataDir);
 console.log(`   ✓ Created ${tiersData.length} bulk discount tiers`);

 return { plans, tiersData, serToPattern, patternToId, tierPatterns };
}

module.exports = { processBulkDiscounts };
