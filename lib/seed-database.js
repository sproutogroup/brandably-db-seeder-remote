const fs = require("fs").promises;
const path = require("path");
const { Client } = require("pg");
const Papa = require("papaparse");
const config = require("../config/global-config");

async function seedTable(client, file, tableName, filePath) {
 console.log(`Processing: ${file} -> ${tableName}`);

 const content = await fs.readFile(filePath, "utf8");
 const parsed = Papa.parse(content, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true,
  transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
 });

 if (parsed.errors.length > 0) {
  console.error(`Errors parsing ${file}:`, parsed.errors);
  return;
 }

 const rows = parsed.data;
 if (rows.length === 0) {
  console.log(`No data found in ${file}`);
  return;
 }

 const columns = Object.keys(rows[0]);
 console.log(`  Columns: ${columns.join(", ")}`);
 console.log(`  Rows: ${rows.length}`);

 try {
  await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
  console.log(`  ✓ Truncated ${tableName}`);
 } catch (err) {
  console.log(`  ⚠ Could not truncate ${tableName}: ${err.message}`);
 }

 let inserted = 0;
 let skipped = 0;

 for (let i = 0; i < rows.length; i++) {
  const row = rows[i];

  if (tableName === "products") {
   if (row.base_price === null || row.base_price === "") {
    row.base_price = 0;
   }
   if (row.is_active !== null && row.is_active !== undefined) {
    row.is_active =
     row.is_active === 1 || row.is_active === true || row.is_active === "true";
   }
  }

  if (tableName === "bulk_discount_plans") {
   if (row.is_active !== null && row.is_active !== undefined) {
    row.is_active =
     row.is_active === 1 || row.is_active === true || row.is_active === "true";
   }
   if (row.discount_type !== null && typeof row.discount_type === "number") {
    row.discount_type = row.discount_type === 1 ? "percentage" : "fixed";
   }
  }

  try {
   const vals = columns.map((col) => {
    const val = row[col];
    return val === "" ? null : val;
   });
   const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(", ");
   const query = `INSERT INTO ${tableName} (${columns.join(
    ", "
   )}) VALUES (${placeholders})`;

   await client.query(query, vals);
   inserted++;
  } catch (rowErr) {
   skipped++;
   if (skipped <= 3) {
    console.log(`  ⚠ Row ${i + 1} error: ${rowErr.message}`);
   }
  }
 }

 console.log(
  `  ✓ Inserted ${inserted} rows into ${tableName}${
   skipped > 0 ? ` (${skipped} skipped)` : ""
  }\n`
 );
}

async function seedDatabase() {
 const client = new Client({ connectionString: config.DB_URL });

 try {
  await client.connect();
  console.log("\n🔌 Connected to database\n");

  const files = await fs.readdir(config.DATA_DIR);
  const availableFiles = files.filter((f) => f.endsWith(".csv"));

  if (availableFiles.length === 0) {
   console.log(`No CSV files found in ${config.DATA_DIR}/`);
   return;
  }

  for (const fileBaseName of config.SEED_ORDER) {
   const file = `${fileBaseName}.csv`;

   if (!availableFiles.includes(file)) {
    console.log(`⊘ Skipping ${file} (not found)`);
    continue;
   }

   const tableName = fileBaseName;
   const filePath = path.join(config.DATA_DIR, file);

   await seedTable(client, file, tableName, filePath);
  }

  console.log("✓ Seeding complete");
 } catch (err) {
  console.error("Error:", err.message);
 } finally {
  await client.end();
 }
}

module.exports = { seedDatabase };
