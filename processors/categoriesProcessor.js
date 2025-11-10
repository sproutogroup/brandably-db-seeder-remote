const { slugify, writeCSV } = require("../lib/utils");

// Updated sortedArray → now objects with `name` + `cover`
const sortedArray = [
 {
  name: "Office",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/office.png",
 },
 {
  name: "Apparel",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/apparel.png",
 },
 {
  name: "Bags",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/bags.png",
 },
 {
  name: "Drinkware",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/drinkware.png",
 },
 {
  name: "Tech",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/tech.png",
 },
 {
  name: "Outdoor",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/outdoor.png",
 },
 {
  name: "Wellness",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/wellness.png",
 },
 {
  name: "Home",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/home.png",
 },
 {
  name: "Other",
  cover:
   "https://mhkvikuzfhnivsuxqgxi.supabase.co/storage/v1/object/public/misc/category_covers/other.png",
 },
];

// Map of name → index for faster lookups
const sortedCategoryNames = sortedArray.map((c) => c.name);
const categoryOrderIndex = Object.fromEntries(
 sortedArray.map((c, i) => [c.name, i])
);

// Subcategory sorting reference
const subcategoryOrder = {
 OFFICE: ["Portfolio", "Notebook", "Writing", "Ruler", "See All"],
 APPAREL: [
  "T-Shirts",
  "Polo",
  "Sweatshirts",
  "Fleeces",
  "Bodywarmers",
  "Joggers",
  "Caps",
  "Beanies",
  "Hats",
  "Scarves",
  "Aprons",
  "Beach Towels",
  "Bath Towels",
  "Bathrobes",
  "Slippers",
  "See All",
 ],
 BAGS: [
  "Backpacks",
  "Laptop Bags",
  "Weekend Bags",
  "Crossbody Bags",
  "Outdoor Bags",
  "Trolley Bags",
  "Toiletry Bags",
  "Cooler Bags",
  "Shopping Bags",
  "Cardholders & Wallets",
  "Accessories",
  "See All",
 ],
 DRINKWARE: [
  "Infuser Bottles",
  "Thermos Flasks",
  "Water Bottles",
  "Insulation Mugs",
  "Ceramic Mugs",
  "Glass Cups",
  "Straws",
  "Accessories",
  "See All",
 ],
 TECH: [
  "Powerbanks",
  "Chargers",
  "Cables",
  "Wearables",
  "Speakers",
  "Headphones",
  "Earbuds",
  "Smart Finder",
  "Travel Adapters",
  "Wearable",
  "Accessories",
  "See All",
 ],
 OUTDOOR: [
  "Umbrellas",
  "Cutters",
  "Rulers",
  "Pocket Knives",
  "Tools",
  "Measuring Tapes",
  "Torches",
  "Picnic",
  "Beach",
  "Sunglasses",
  "Cooler Bags",
  "Barbecue",
  "Accessories",
  "Games",
  "See All",
 ],
 WELLNESS: ["Sports", "Candles", "Yoga", "First Aid", "Safety"],
 HOME: [
  "Lunch Boxes",
  "Food Flasks",
  "Cutting Boards & Trays",
  "Knives",
  "Pots & pans",
  "Dishes",
  "Grill",
  "Utensils",
  "Aprons",
  "Candles",
  "Lamps",
  "Bathroom",
  "Games",
  "Garden",
  "Blankets",
  "Slippers",
  "Accessories",
 ],
 OTHER: ["Custom Packs", "Preset Packs"],
};

async function processCategories(data, dataDir) {
 console.log("\n🔄 Processing categories...");

 // Extract unique main categories from data
 const uniqueCategories = [
  ...new Set(data.map((row) => row.MainCategory).filter(Boolean)),
 ];

 // Only keep categories that exist in sortedArray
 const filteredCategories = uniqueCategories.filter((c) =>
  sortedCategoryNames.includes(c)
 );

 // Sort based on index in sortedArray
 const sortedCategories = filteredCategories.sort(
  (a, b) => categoryOrderIndex[a] - categoryOrderIndex[b]
 );

 // Build category records
 const categories = sortedCategories.map((name, idx) => {
  const match = sortedArray.find((c) => c.name === name);
  return {
   id: idx + 1,
   name,
   slug: slugify(name),
   cover: match?.cover || "",
   sort: idx + 1,
  };
 });

 await writeCSV("product_categories.csv", categories, dataDir);
 console.log(`   ✓ Created ${categories.length} categories`);

 return categories;
}

async function processSubcategories(data, categories, dataDir) {
 console.log("\n🔄 Processing subcategories...");

 const subcategoryPairs = new Map();

 // Collect main|sub pairs
 data.forEach((row) => {
  const main = row.MainCategory;
  const sub = row.SubCategory;
  if (main && sub && sortedCategoryNames.includes(main)) {
   const key = `${main}|${sub}`;
   if (!subcategoryPairs.has(key)) {
    subcategoryPairs.set(key, { main, sub });
   }
  }
 });

 const categoryLookup = Object.fromEntries(
  categories.map((c) => [c.name, c.id])
 );

 // Group subcategories by parent category
 const grouped = {};
 for (const pair of subcategoryPairs.values()) {
  if (!grouped[pair.main]) grouped[pair.main] = [];
  grouped[pair.main].push(pair.sub);
 }

 const subcategories = [];
 let idCounter = 1;

 // Helper function to find fuzzy match in order list
 const findOrderIndex = (subName, orderList) => {
  const subLower = subName.toLowerCase();

  // First try exact match (case-insensitive)
  let idx = orderList.findIndex((x) => x.toLowerCase() === subLower);
  if (idx !== -1) return idx;

  // Try singular/plural variations
  const singularSub = subLower.endsWith("s") ? subLower.slice(0, -1) : subLower;
  const pluralSub = subLower.endsWith("s") ? subLower : subLower + "s";

  idx = orderList.findIndex((x) => {
   const xLower = x.toLowerCase();
   return xLower === singularSub || xLower === pluralSub;
  });

  return idx;
 };

 // Sort within each category
 for (const [main, subs] of Object.entries(grouped)) {
  const orderList = subcategoryOrder[main.toUpperCase()] || [];

  const sortedSubs = subs.sort((a, b) => {
   const idxA = findOrderIndex(a, orderList);
   const idxB = findOrderIndex(b, orderList);

   if (idxA !== -1 && idxB !== -1) return idxA - idxB;
   if (idxA !== -1) return -1;
   if (idxB !== -1) return 1;
   return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  for (const sub of sortedSubs) {
   const orderIndex = findOrderIndex(sub, orderList);
   const sortValue = orderIndex !== -1 ? orderIndex + 1 : 999;

   subcategories.push({
    id: idCounter++,
    name: sub,
    slug: slugify(sub),
    parent_id: categoryLookup[main],
    sort: sortValue,
   });
  }
 }

 await writeCSV("product_subcategories.csv", subcategories, dataDir);
 console.log(`   ✓ Created ${subcategories.length} subcategories`);

 return subcategories;
}

module.exports = {
 processCategories,
 processSubcategories,
};
