const { writeCSV } = require("../lib/utils");

async function processPrintPositions(data, dataDir) {
 console.log("\n🔄 Processing print positions...");

 const uniquePositions = new Map();

 data.forEach((row) => {
  if (row.PrintPositionCode && row.PrintPosition) {
   const code = String(row.PrintPositionCode);
   if (!uniquePositions.has(code)) {
    uniquePositions.set(code, {
     name: String(row.PrintPosition),
     code: code,
    });
   }
  }
 });

 const positions = Array.from(uniquePositions.values()).map((item, index) => ({
  id: index + 1,
  name: item.name,
  code: item.code,
 }));

 await writeCSV("print_positions.csv", positions, dataDir);
 console.log(`   ✓ Created ${positions.length} print positions`);

 // Create lookup map
 const printPositionCodeToId = new Map();
 positions.forEach((pos) => {
  printPositionCodeToId.set(pos.code, pos.id);
 });

 return { printPositions: positions, printPositionCodeToId };
}

module.exports = { processPrintPositions };
