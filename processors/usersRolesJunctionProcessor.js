const { writeCSV } = require("../lib/utils");

async function processUsersRolesJunction(userRoles, dataDir) {
 console.log("\n🔄 Creating user-role assignments...");
 await writeCSV("users_roles_junction.csv", userRoles, dataDir);
 console.log(`   ✓ Created ${userRoles.length} user-role assignments`);
 return userRoles;
}

module.exports = { processUsersRolesJunction };
