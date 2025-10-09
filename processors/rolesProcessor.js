const { writeCSV } = require("../lib/utils");

async function processRoles(roles, dataDir) {
 console.log("\n🔄 Creating roles...");
 await writeCSV("roles.csv", roles, dataDir);
 console.log(`   ✓ Created ${roles.length} roles`);
 return roles;
}

module.exports = { processRoles };
