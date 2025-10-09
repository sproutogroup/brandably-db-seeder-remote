const { writeCSV } = require("../lib/utils");

async function processRolesPermissionsJunction(rolePermissions, dataDir) {
 console.log("\n🔄 Creating role-permission assignments...");
 await writeCSV("roles_permissions_junction.csv", rolePermissions, dataDir);
 console.log(
  `   ✓ Created ${rolePermissions.length} role-permission assignments`
 );
 return rolePermissions;
}

module.exports = { processRolesPermissionsJunction };
