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

// Write data to CSV
async function writeCSV(filename, data, dataDir) {
 const filepath = path.join(dataDir, filename);
 const csv = Papa.unparse(data);
 await fs.writeFile(filepath, csv, "utf8");
}

module.exports = {
 slugify,
 writeCSV,
};
