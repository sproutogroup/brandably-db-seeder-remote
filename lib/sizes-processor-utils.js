function extractSizeFromItemCode(itemCode) {
 // Get the part after the last dot
 const lastDotIndex = itemCode.lastIndexOf(".");
 if (lastDotIndex === -1) return null;

 const sizePart = itemCode.substring(lastDotIndex + 1).toUpperCase();

 // Pattern 1: X's followed by a letter (XXS, XL, XXXL, etc.)
 const xPattern = /^(X+)([A-Z])$/;
 const xMatch = sizePart.match(xPattern);

 if (xMatch) {
  const xCount = xMatch[1].length; // Number of X's
  const letter = xMatch[2];

  // Calculate value based on letter and X count
  let baseValue;
  if (letter === "S") {
   // XS = 2, XXS = 1, XXXS = 0 (smaller means lower value)
   baseValue = 3 - xCount;
  } else if (letter === "L") {
   // XL = 6, XXL = 7, XXXL = 8 (larger means higher value)
   baseValue = 5 + xCount;
  } else if (letter === "M") {
   // M = 4, XM doesn't really exist but handle it
   baseValue = 4;
  } else {
   return null;
  }

  return {
   value: baseValue,
   unit: "size",
   display: sizePart,
   source: "itemCode",
  };
 }

 // Pattern 2: Number followed by X and letter (4XL, 5XL, etc.)
 const numXPattern = /^(\d+)X([A-Z])$/;
 const numXMatch = sizePart.match(numXPattern);

 if (numXMatch) {
  const num = parseInt(numXMatch[1]);
  const letter = numXMatch[2];

  let baseValue;
  if (letter === "L") {
   // 4XL = 9, 5XL = 10, etc.
   baseValue = 5 + num;
  } else if (letter === "S") {
   // 4XS would be even smaller
   baseValue = 3 - num;
  } else {
   return null;
  }

  return {
   value: baseValue,
   unit: "size",
   display: sizePart,
   source: "itemCode",
  };
 }

 // Pattern 3: Single letter (S, M, L)
 const singleLetterPattern = /^([SML])$/;
 const letterMatch = sizePart.match(singleLetterPattern);

 if (letterMatch) {
  const letter = letterMatch[1];
  let baseValue;

  if (letter === "S") baseValue = 3;
  else if (letter === "M") baseValue = 4;
  else if (letter === "L") baseValue = 5;

  return {
   value: baseValue,
   unit: "size",
   display: sizePart,
   source: "itemCode",
  };
 }

 return null;
}

function extractSizeFromName(itemName) {
 // Match patterns like: 23", 30 cm, 12", etc.
 const sizePattern = /(\d+(?:\.\d+)?)\s*("|cm|inch|inches|mm|ml|l|oz)\b/gi;
 const matches = [...itemName.matchAll(sizePattern)];

 if (matches.length === 0) return null;

 // Return the last match (usually the most relevant size)
 const lastMatch = matches[matches.length - 1];

 // Normalize unit
 let unit = lastMatch[2].toLowerCase();
 if (unit === '"') unit = "inches";
 if (unit === "inch") unit = "inches";

 return {
  value: parseFloat(lastMatch[1]),
  unit: unit,
  display: lastMatch[0],
  source: "itemName",
 };
}

function getBaseProductName(itemName, itemCode) {
 // Remove size patterns from name
 const sizePattern = /\b\d+(?:\.\d+)?\s*("|cm|inch|inches|mm|ml|l|oz)\b/gi;
 let baseName = itemName.replace(sizePattern, "").replace(/,\s*$/, "").trim();

 // Also create a base item code (remove size part)
 const lastDotIndex = itemCode.lastIndexOf(".");
 const baseCode =
  lastDotIndex !== -1 ? itemCode.substring(0, lastDotIndex) : itemCode;

 return { baseName, baseCode };
}

function getSizeId(item, sizeLookup) {
 const {
  extractSizeFromItemCode,
  extractSizeFromName,
 } = require("../lib/sizes-processor-utils");

 // Try to extract size from ItemCode first, then from ItemName
 let sizeInfo = extractSizeFromItemCode(item.ItemCode);
 if (!sizeInfo) {
  sizeInfo = extractSizeFromName(item.ItemName);
 }

 if (!sizeInfo) return null;

 // Look up the size ID using "value-unit" as the key
 const sizeKey = `${sizeInfo.value}-${sizeInfo.unit}`;
 return sizeLookup[sizeKey] || null;
}

module.exports = {
 extractSizeFromItemCode,
 extractSizeFromName,
 getBaseProductName,
 getSizeId,
};
