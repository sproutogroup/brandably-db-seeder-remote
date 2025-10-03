const { processExcel } = require("./functions/process-excel");
const { seedDatabase } = require("./functions/seed-database");

// Hardcoded path - change this to your Excel file location
const EXCEL_PATH = "./data/data.xlsx";

async function main() {
 try {
  console.log("🚀 Starting Excel to Database Pipeline...\n");

  // Step 1: Process Excel and generate CSVs
  await processExcel(EXCEL_PATH);

  // Step 2: Seed database
  console.log("\n🌱 Starting database seeding...");
  await seedDatabase();

  console.log("\n✅ Pipeline completed successfully!");
 } catch (err) {
  console.error("\n❌ Error:", err.message);
  console.error(err.stack);
  process.exit(1);
 }
}

// Run
main();
