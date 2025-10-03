const { writeCSV } = require("../lib/utils");

async function processColors(data, dataDir) {
 console.log("\n🔄 Processing colors...");

 const colorMap = new Map();
 data.forEach((row) => {
  if (row.Color && row.HexColor) {
   let hex = String(row.HexColor).trim();
   if (!hex.startsWith("#")) hex = `#${hex}`;
   colorMap.set(row.Color, hex);
  }
 });

 const colors = Array.from(colorMap.entries()).map(([name, hex_code], idx) => ({
  id: idx + 1,
  name,
  hex_code,
 }));

 await writeCSV("product_colors.csv", colors, dataDir);
 console.log(`   ✓ Created ${colors.length} colors`);

 return colors;
}

module.exports = { processColors };
