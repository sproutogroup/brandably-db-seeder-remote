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
  "products",
  "bulk_discount_plans",
  "bulk_discount_tiers",
  "product_variants",
 ],

 QTY_PRICE_PAIRS: [
  [2, "Qty_2", "PriceOrig_2"],
  [3, "Qty_3", "PriceOrig_3"],
  [4, "Qty_4", "PriceOrig_4"],
  [5, "Qty_5", "PriceOrig_5"],
  [6, "Qty_6", "PriceOrig_6"],
 ],
};
