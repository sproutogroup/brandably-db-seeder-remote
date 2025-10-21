const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { supabase } = require("../lib/supabase-client");

const BUCKET_NAME = "product_images";

async function fileExistsInSupabase(storagePath) {
 try {
  const { data, error } = await supabase.storage
   .from(BUCKET_NAME)
   .list(path.dirname(storagePath), {
    search: path.basename(storagePath),
   });

  if (error) {
   return false;
  }

  return data && data.length > 0;
 } catch (error) {
  return false;
 }
}

async function calculateChecksum(filePath) {
 try {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash("md5").update(fileBuffer).digest("hex");
 } catch (error) {
  console.error(`Error calculating checksum for ${filePath}:`, error.message);
  return null;
 }
}

async function getFileSize(filePath) {
 try {
  const stats = await fs.stat(filePath);
  return stats.size;
 } catch (error) {
  console.error(`Error getting file size for ${filePath}:`, error.message);
  return null;
 }
}

async function uploadToSupabase(localFilePath, filename, itemCode) {
 try {
  // Define storage path: products/{variantId}/{filename}
  const storagePath = `${itemCode}/${filename}`;

  // Check if file already exists
  const exists = await fileExistsInSupabase(storagePath);

  if (exists) {
   // Get public URL for existing file
   const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

   return {
    success: true,
    publicUrl: urlData.publicUrl,
    storagePath: storagePath,
    uploadedAt: new Date().toISOString(),
    skipped: true, // Flag to indicate file was already present
   };
  }

  // Read file
  const fileBuffer = await fs.readFile(localFilePath);

  // Upload to Supabase
  const { data, error } = await supabase.storage
   .from(BUCKET_NAME)
   .upload(storagePath, fileBuffer, {
    contentType: getContentType(filename),
    upsert: false, // Don't overwrite since we already checked
   });

  if (error) {
   throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
   .from(BUCKET_NAME)
   .getPublicUrl(storagePath);

  return {
   success: true,
   publicUrl: urlData.publicUrl,
   storagePath: storagePath,
   uploadedAt: new Date().toISOString(),
   skipped: false,
  };
 } catch (error) {
  return {
   success: false,
   error: error.message,
  };
 }
}

function getContentType(filename) {
 const ext = path.extname(filename).toLowerCase();
 const types = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
 };
 return types[ext] || "image/jpeg";
}

module.exports = {
 uploadToSupabase,
 calculateChecksum,
 getFileSize,
};
