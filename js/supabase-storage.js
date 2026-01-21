/**
 * Supabase Storage Helper
 * Handles file uploads to Supabase Storage
 */

class SupabaseStorage {
  constructor() {
    this.supabase = window.supabaseClient;
    if (!this.supabase) {
      console.error('Supabase client not initialized');
    }
  }

  /**
   * Upload images to Supabase Storage
   * @param {FileList} files - Files to upload
   * @param {string} bucket - Storage bucket name
   * @param {string} folder - Folder path in bucket
   * @param {Function} onProgress - Progress callback (progress: number)
   * @returns {Promise<string[]>} Array of public URLs
   */
  async uploadImages(files, bucket = 'listings', folder = '', onProgress = null) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Please check js/supabase-config.js is loaded.');
    }

    if (!files || files.length === 0) {
      return [];
    }

    // Check if bucket exists (non-blocking - will fail on upload if doesn't exist)
    console.log(`🔍 Checking if bucket "${bucket}" exists...`);
    try {
      const bucketExists = await this.checkBucket(bucket);
      if (bucketExists) {
        console.log(`✅ Bucket "${bucket}" exists, proceeding with upload...`);
      } else {
        console.warn(`⚠️ Bucket check failed, but proceeding anyway (upload will verify)`);
      }
    } catch (checkError) {
      console.warn(`⚠️ Bucket check error (non-critical):`, checkError);
      // Continue anyway - upload will fail with better error if bucket doesn't exist
    }

    const urls = [];
    const totalFiles = files.length;
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        continue;
      }

      try {
        // Create file path - ensure no leading/trailing slashes
        const fileExt = file.name.split('.').pop();
        const sanitizedFolder = folder.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = sanitizedFolder ? `${sanitizedFolder}/${fileName}` : fileName;

        console.log(`📤 Uploading ${i + 1}/${totalFiles}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`📂 Target path: ${bucket}/${filePath}`);
        
        // Update progress before upload starts
        if (onProgress) {
          const preProgress = ((i) / totalFiles) * 100;
          onProgress(preProgress, i, totalFiles);
        }

        // Upload file with timeout
        console.log(`⏳ Starting upload to Supabase Storage...`);
        const uploadPromise = this.supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'image/jpeg'
          });

        // Add timeout (30 seconds per file)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Upload timeout for ${file.name}. File may be too large or network is slow.`));
          }, 30000);
        });

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

        if (error) {
          console.error(`❌ Upload error for ${file.name}:`, error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // Provide helpful error messages
          let errorMessage = `Failed to upload ${file.name}`;
          if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
            errorMessage += `: Bucket "${bucket}" not found. Please create it in Supabase Dashboard → Storage.`;
          } else if (error.message.includes('permission') || error.message.includes('policy') || error.message.includes('new row violates')) {
            errorMessage += `: Permission denied. Please check Storage policies in Supabase Dashboard → Storage → Policies. Create a policy that allows INSERT for public.`;
          } else if (error.message.includes('timeout')) {
            errorMessage += `: Upload timeout. File may be too large. Try smaller images (< 5MB each).`;
          } else {
            errorMessage += `: ${error.message || JSON.stringify(error)}`;
          }
          
          throw new Error(errorMessage);
        }

        console.log(`✅ File ${i + 1} uploaded successfully, getting public URL...`);

        // Get public URL
        const { data: urlData } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          urls.push(urlData.publicUrl);
          uploadedCount++;
          
          console.log(`✅ Uploaded ${i + 1}/${totalFiles}: ${urlData.publicUrl.substring(0, 50)}...`);

          // Update progress after upload
          if (onProgress) {
            const progress = (uploadedCount / totalFiles) * 100;
            onProgress(progress, uploadedCount, totalFiles);
          }
        } else {
          throw new Error(`Failed to get public URL for ${file.name}`);
        }

      } catch (error) {
        console.error(`❌ Error uploading ${file.name}:`, error);
        throw error;
      }
    }

    console.log(`✅ All ${urls.length} images uploaded successfully!`);
    return urls;
  }

  /**
   * Delete an image from Supabase Storage
   * @param {string} filePath - Path to file in bucket
   * @param {string} bucket - Storage bucket name
   */
  async deleteImage(filePath, bucket = 'listings') {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      throw error;
    }

    console.log(`✅ Deleted image: ${filePath}`);
  }

  /**
   * Check if storage bucket exists
   * @param {string} bucket - Bucket name
   */
  async checkBucket(bucket = 'listings') {
    if (!this.supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    try {
      // Try direct access instead of listBuckets (which requires admin permissions)
      // If we can list files (even empty), bucket exists
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list('', { limit: 1 });
      
      if (error) {
        // Check if it's a "bucket not found" error
        if (error.message && (error.message.includes('not found') || error.message.includes('Bucket'))) {
          console.warn(`⚠️ Bucket "${bucket}" not found`);
          return false;
        }
        // Other errors might be permission issues, but bucket might exist
        console.warn(`⚠️ Could not verify bucket (might be permission issue):`, error.message);
        // Return true to allow upload to try (will get better error if bucket doesn't exist)
        return true;
      }
      
      // If we got data (even empty array), bucket exists
      console.log(`✅ Bucket "${bucket}" exists and is accessible`);
      return true;
    } catch (error) {
      console.error('Error checking bucket:', error);
      // Return true to allow upload attempt (will fail with better error if bucket doesn't exist)
      return true;
    }
  }
}

// Create global instance
window.supabaseStorage = new SupabaseStorage();

