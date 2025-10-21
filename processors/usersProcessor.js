const { writeCSV } = require("../lib/utils");

async function processUsers(users, dataDir) {
 console.log("\n🔄 Creating users...");
 await writeCSV("users.csv", users, dataDir);
 console.log(`   ✓ Created ${users.length} users`);
 return users;
}

module.exports = { processUsers };
