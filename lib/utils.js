const fs = require("fs").promises;
const path = require("path");
const Papa = require("papaparse");

// Convert text to URL-friendly slug
function slugify(text) {
 if (typeof text !== "string") return "";
 return text
  .trim()
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[\s_]+/g, "-")
  .replace(/[^a-z0-9-]/g, "")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");
}

// Extract size from ItemCode (after last dot)
function extractSizeId(itemCode, sizeLookup) {
 if (!itemCode) return null;
 const itemCodeStr = String(itemCode);
 if (itemCodeStr.includes(".")) {
  const lastPart = itemCodeStr.split(".").pop().trim().toUpperCase();
  return sizeLookup[lastPart] || null;
 }
 return null;
}

// Write data to CSV
async function writeCSV(filename, data, dataDir) {
 const filepath = path.join(dataDir, filename);
 const csv = Papa.unparse(data);
 await fs.writeFile(filepath, csv, "utf8");
}

module.exports = {
 slugify,
 extractSizeId,
 writeCSV,
};
