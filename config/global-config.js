module.exports = {
 DB_URL: "postgres://postgres:3373@localhost:5432/brandably",
 DATA_DIR: "./output",
 IMAGES_DIR: "./images",

 SEED_ORDER: [
  "product_categories",
  "product_subcategories",
  "product_brands",
  "product_colors",
  "product_sizes",
  "product_suppliers",
  "products",
  "bulk_discount_plans",
  "bulk_discount_tiers",
  "product_variants",
  "product_images",
 ],

 SIZES: [
  { id: 1, name: "XXS" },
  { id: 2, name: "XS" },
  { id: 3, name: "S" },
  { id: 4, name: "M" },
  { id: 5, name: "L" },
  { id: 6, name: "XL" },
  { id: 7, name: "XXL" },
  { id: 8, name: "XXXL" },
  { id: 9, name: "4XL" },
  { id: 10, name: "5XL" },
 ],

 SUPPLIERS: [{ id: 1, name: "XD Connects", slug: "xd-connects" }],

 QTY_PRICE_PAIRS: [
  ["Qty_2", "PriceOrig_2"],
  ["Qty_3", "PriceOrig_3"],
  ["Qty_4", "PriceOrig_4"],
  ["Qty_5", "PriceOrig_5"],
  ["Qty_6", "PriceOrig_6"],
 ],
};
