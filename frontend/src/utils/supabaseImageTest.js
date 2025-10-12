// frontend/src/utils/supabaseImageTest.js - Test Supabase image accessibility

// Test if a Supabase image URL is accessible
export const testSupabaseImage = async (url) => {
  if (!url || !url.includes('supabase')) {
    return { accessible: false, error: 'Not a Supabase URL' };
  }

  try {
    console.log('🔍 Testing Supabase image accessibility:', url);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ Supabase image is accessible');
      return { accessible: true, status: response.status };
    } else {
      console.log('❌ Supabase image not accessible:', response.status, response.statusText);
      return { accessible: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    console.error('❌ Error testing Supabase image:', error);
    return { accessible: false, error: error.message };
  }
};

// Force load a Supabase image with retries
export const forceLoadSupabaseImage = (url, maxRetries = 3) => {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const attemptLoad = () => {
      const img = new Image();
      
      img.onload = () => {
        console.log('✅ Supabase image loaded successfully:', url);
        resolve(url);
      };
      
      img.onerror = (error) => {
        retries++;
        console.warn(`❌ Supabase image load attempt ${retries} failed:`, url, error);
        
        if (retries < maxRetries) {
          console.log(`🔄 Retrying in ${retries * 1000}ms...`);
          setTimeout(attemptLoad, retries * 1000);
        } else {
          console.error('❌ All retry attempts failed for Supabase image:', url);
          reject(new Error(`Failed to load Supabase image after ${maxRetries} attempts`));
        }
      };
      
      // Add cache busting parameter
      const cacheBustUrl = url + (url.includes('?') ? '&' : '?') + `cb=${Date.now()}`;
      console.log('🖼️ Loading image:', cacheBustUrl);
      img.src = cacheBustUrl;
    };
    
    attemptLoad();
  });
};

// Get Supabase image with fallback
export const getSupabaseImageWithFallback = async (supabaseUrl, fallbackUrl) => {
  try {
    // First test if the image is accessible
    const testResult = await testSupabaseImage(supabaseUrl);
    
    if (testResult.accessible) {
      // Try to load the image
      await forceLoadSupabaseImage(supabaseUrl);
      return supabaseUrl;
    } else {
      console.warn('⚠️ Supabase image not accessible, using fallback:', testResult.error);
      return fallbackUrl;
    }
  } catch (error) {
    console.warn('⚠️ Supabase image load failed, using fallback:', error.message);
    return fallbackUrl;
  }
};
