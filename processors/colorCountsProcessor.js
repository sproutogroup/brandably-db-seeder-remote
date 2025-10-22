const { writeCSV } = require("../lib/utils");

async function processColorCounts(data, dataDir) {
 console.log("\n🔄 Processing color counts...");

 const uniqueCounts = new Set();

 data.forEach((row) => {
  if (row.NrOfColors) {
   uniqueCounts.add(row.NrOfColors);
  }
 });

 // Convert to array and sort numerically
 const sortedCounts = Array.from(uniqueCounts).sort((a, b) => a - b);

 const colorCounts = sortedCounts.map((count, index) => ({
  id: index + 1,
  count: count,
 }));

 // Create lookup: count value -> id
 const countToId = new Map();
 colorCounts.forEach((item) => {
  countToId.set(item.count, item.id);
 });

 await writeCSV("color_counts.csv", colorCounts, dataDir);
 console.log(`   ✓ Created ${colorCounts.length} color counts`);

 return { colorCounts, countToId };
}

module.exports = {
 processColorCounts,
};
