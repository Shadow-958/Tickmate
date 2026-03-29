// backend/services/supabaseService.js - SHOULD EXIST

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const uploadFile = async (fileBuffer, fileName, folder = 'events', bucket = 'event-images') => {
  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${timestamp}-${randomString}.${fileExt}`;

    console.log(`📤 Uploading file to Supabase: ${uniqueFileName}`);

    // First, ensure the bucket exists and is public
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.warn('⚠️ Could not list buckets:', listError.message);
      } else {
        const bucketExists = buckets.some(b => b.name === bucket);
        if (!bucketExists) {
          console.log(`📦 Creating bucket: ${bucket}`);
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
            fileSizeLimit: 10485760 // 10MB
          });
          if (createError) {
            console.warn('⚠️ Could not create bucket:', createError.message);
          }
        }
      }
    } catch (bucketError) {
      console.warn('⚠️ Bucket setup error:', bucketError.message);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, fileBuffer, {
        contentType: getContentType(fileExt),
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName);

    console.log(`✅ File uploaded successfully: ${urlData.publicUrl}`);

    // Test if the URL is accessible
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.warn('⚠️ Uploaded file may not be publicly accessible');
      }
    } catch (testError) {
      console.warn('⚠️ Could not test file accessibility:', testError.message);
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: uniqueFileName
    };

  } catch (error) {
    console.error('❌ Supabase upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const deleteFile = async (filePath, bucket = 'event-images') => {
  try {
    console.log(`🗑️ Deleting file from Supabase: ${filePath}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log(`✅ File deleted successfully`);
    return { success: true };

  } catch (error) {
    console.error('❌ Supabase delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getContentType = (fileExt) => {
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  };
  
  return contentTypes[fileExt.toLowerCase()] || 'application/octet-stream';
};

module.exports = {
  supabase,
  uploadFile,
  deleteFile
};
