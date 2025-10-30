const { processExcel } = require("./processors");
const { seedDatabase } = require("./lib/seed-database");

const EXCEL_PATH_MAIN = "./data/main.xlsx";
const EXCEL_PATH_PRINTING = "./data/printing.xlsx";
const EXCEL_PATH_POSITIONS = "./data/positions.xlsx";

async function main() {
 try {
  console.log("🚀 Starting Excel to Database Pipeline...\n");

  // await processExcel([
  //  EXCEL_PATH_MAIN,
  //  EXCEL_PATH_PRINTING,
  //  EXCEL_PATH_POSITIONS,
  // ]);

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
