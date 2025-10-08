const { processExcel } = require("./processors");
const { seedDatabase } = require("./lib/seed-database");

const EXCEL_PATH = "./data/data.xlsx";

async function main() {
 try {
  console.log("🚀 Starting Excel to Database Pipeline...\n");

  await processExcel(EXCEL_PATH);

  console.log("\n🌱 Starting database seeding...");
  await seedDatabase();

  console.log("\n✅ Pipeline completed successfully!");
 } catch (err) {
  console.error("\n❌ Error:", err.message);
  console.error(err.stack);
  process.exit(1);
 }
}

main();
