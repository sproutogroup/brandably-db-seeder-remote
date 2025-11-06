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
  const uniquePrintCode = getUniquePrintCode(row);
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
     gross: parseFloat(grossPrice),
     value: parseFloat(netPrice) * 2,
    });
   }
  });

  if (tiers.length === 0) return;

  tiers.sort((a, b) => a.quantity - b.quantity);
  const patternHash = JSON.stringify(tiers);

  if (!tierPatterns.has(patternHash)) {
   tierPatterns.set(patternHash, tiers);
  }

  printCodeToPattern.set(uniquePrintCode, patternHash);
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

function getUniquePrintCode(row) {
 const printCode = row.PrintCode;
 const colorCount = row.NrOfColors;
 const hasPrintArea =
  row.PrintArea &&
  row.PrintAreaFromCM2 !== undefined &&
  row.PrintAreaToCM2 !== undefined;

 // Build display name based on what varies
 let displayName = printCode;

 // Add area to name if present
 if (hasPrintArea) {
  displayName = `${printCode} (${row.PrintAreaFromCM2}cm2 - ${row.PrintAreaToCM2}cm2)`;
 }

 // Add color count to name if > 1
 if (colorCount) {
  if (hasPrintArea) {
   displayName = `${printCode} (${colorCount} colors, ${row.PrintAreaFromCM2}cm2 - ${row.PrintAreaToCM2}cm2)`;
  } else {
   displayName = `${printCode} (${colorCount} color${
    colorCount > 1 ? "s" : ""
   })`;
  }
 }

 return displayName;
}

module.exports = {
 processPrintBulkDiscounts,
};
