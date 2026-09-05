const supabase = require('../config/supabase');

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'obstacle-images';

/**
 * StorageService
 * Handles file uploads to Supabase Storage.
 * Images are stored in the 'obstacle-images' bucket.
 */
class StorageService {
  /**
   * Uploads an image buffer to Supabase Storage.
   *
   * @param {Buffer} buffer    - Raw file buffer (from Multer memory storage)
   * @param {string} path      - Storage path, e.g. 'user-id/timestamp.jpg'
   * @param {string} mimeType  - e.g. 'image/jpeg'
   * @returns {string} Public URL of the uploaded image
   */
  async uploadImage(buffer, path, mimeType) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      const err = new Error(`Image upload failed: ${error.message}`);
      err.status = 500;
      throw err;
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  /**
   * Deletes an image from Supabase Storage.
   * Called when an obstacle is deleted.
   *
   * @param {string} path - Storage path of the file to delete
   */
  async deleteImage(path) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error('[StorageService] Failed to delete image:', error.message);
    }
  }
}

module.exports = new StorageService();
