const { writeCSV } = require("../lib/utils");

async function processPermissions(permissions, dataDir) {
 console.log("\n🔄 Creating permissions...");

 // Add timestamps
 const permissionsWithTimestamps = permissions.map((p) => ({
  ...p,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
 }));

 await writeCSV("permissions.csv", permissionsWithTimestamps, dataDir);
 console.log(`   ✓ Created ${permissions.length} permissions`);
 return permissionsWithTimestamps;
}

module.exports = { processPermissions };
