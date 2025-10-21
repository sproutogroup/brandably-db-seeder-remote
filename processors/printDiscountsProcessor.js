const { writeCSV } = require("../lib/utils");

async function processPrintBulkDiscounts(data, dataDir) {
 console.log("\n🔄 Processing print bulk discounts...");

 if (!data[0]?.PrintCode) {
  console.log("   ❌ Error: 'PrintCode' column not found!");
  return {
   plans: [],
   tiersData: [],
   printCodeToPattern: new Map(),
   patternToId: new Map(),
  };
 }

 // Extract quantities dynamically from column names
 const quantities = new Set();
 const firstRow = data[0];
 Object.keys(firstRow).forEach((key) => {
  const match = key.match(/^PrintPriceNet_(\d+)$/);
  if (match) {
   quantities.add(parseInt(match[1]));
  }
 });

 const sortedQuantities = Array.from(quantities).sort((a, b) => a - b);
 console.log(
  `   ✓ Found ${
   sortedQuantities.length
  } quantity tiers: [${sortedQuantities.join(", ")}]`
 );

 const tierPatterns = new Map();
 const printCodeToPattern = new Map();

 data.forEach((row) => {
  const printCode = row.PrintCode;
  const tiers = [];

  sortedQuantities.forEach((qty) => {
   const netPrice = row[`PrintPriceNet_${qty}`];
   const vdpPrice = row[`VDPPriceNet_${qty}`];
   const grossPrice = row[`PrintPriceGross_${qty}`];

   if (netPrice != null && grossPrice != null && vdpPrice != null) {
    tiers.push({
     quantity: qty,
     net: parseFloat(netPrice),
     vdp: parseFloat(vdpPrice),
     value: parseFloat(grossPrice),
    });
   }
  });

  if (tiers.length === 0) return;

  tiers.sort((a, b) => a.quantity - b.quantity);
  const patternHash = JSON.stringify(tiers);

  if (!tierPatterns.has(patternHash)) {
   tierPatterns.set(patternHash, tiers);
  }

  printCodeToPattern.set(printCode, patternHash);
 });

 console.log(`   ✓ Found ${tierPatterns.size} unique print discount patterns`);
 console.log(
  `   ✓ Processing ${printCodeToPattern.size} print codes with discounts`
 );

 // Create print_bulk_discount_plans
 const patternToId = new Map();
 const plans = [];
 let planId = 1;

 tierPatterns.forEach((tiers, patternHash) => {
  plans.push({
   id: planId,
   name: `Print Bulk Discount Plan ${planId}`,
   discount_type: "fixed_price",
   is_active: true,
  });
  patternToId.set(patternHash, planId);
  planId++;
 });

 await writeCSV("print_bulk_discount_plans.csv", plans, dataDir);
 console.log(`   ✓ Created ${plans.length} print bulk discount plans`);

 // Create print_bulk_discount_tiers
 const tiersData = [];
 let tierId = 1;

 tierPatterns.forEach((tiers, patternHash) => {
  const planId = patternToId.get(patternHash);
  tiers.forEach((tier) => {
   tiersData.push({
    id: tierId,
    print_bulk_discount_plan_id: planId,
    quantity: tier.quantity,
    value: tier.value,
    vdp: tier.vdp,
    net: tier.net,
   });
   tierId++;
  });
 });

 await writeCSV("print_bulk_discount_tiers.csv", tiersData, dataDir);
 console.log(`   ✓ Created ${tiersData.length} print bulk discount tiers`);

 const printCodeToPlanId = new Map();
 printCodeToPattern.forEach((patternHash, printCode) => {
  printCodeToPlanId.set(printCode, patternToId.get(patternHash));
 });

 return {
  plans,
  tiersData,
  printCodeToPattern,
  patternToId,
  tierPatterns,
  printCodeToPlanId,
 };
}

module.exports = {
 processPrintBulkDiscounts,
};
