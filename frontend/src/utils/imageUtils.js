// frontend/src/utils/imageUtils.js - Image handling utilities

// Fallback images by category
const getFallbackImage = (category = 'general') => {
  const fallbackImages = {
    'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop&q=80',
    'tech-meetups': 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=600&fit=crop&q=80',
    'workshops-training': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop&q=80',
    'open-mic-comedy': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop&q=80',
    'fitness-bootcamp': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop&q=80',
    'conferences': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop&q=80',
    'networking': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=600&fit=crop&q=80',
    'music-concerts': 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=600&fit=crop&q=80',
    'sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop&q=80',
    'art-exhibitions': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=600&fit=crop&q=80',
    'business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop&q=80',
    'other': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop&q=80',
    'general': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop&q=80'
  };
  
  return fallbackImages[category?.toLowerCase()] || fallbackImages.general;
};

// Check if URL is a Supabase URL
const isSupabaseUrl = (url) => {
  return url && (url.includes('supabase.co') || url.includes('supabase'));
};

// Get the best image URL with fallback
const getBestImageUrl = (bannerImageUrl, bannerImage, category) => {
  // Priority: bannerImageUrl -> bannerImage -> fallback
  const primaryUrl = bannerImageUrl || bannerImage;
  
  if (!primaryUrl) {
    return getFallbackImage(category);
  }
  
  // If it's a Supabase URL, return it directly - don't validate
  if (isSupabaseUrl(primaryUrl)) {
    return primaryUrl;
  }
  
  // For other URLs, validate them
  if (isValidImageUrl(primaryUrl)) {
    return primaryUrl;
  }
  
  return getFallbackImage(category);
};

// Validate image URL
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const brokenUrls = [
    'via.placeholder.com',
    'placehold.co',
    'FFFFFF?text=Event+Banner',
    'placeholder',
    'example.com',
    'localhost',
    'undefined',
    'null',
    '127.0.0.1'
  ];
  
  if (brokenUrls.some(broken => url.includes(broken))) {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Create image loading promise
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Test if image is accessible
const testImageAccess = async (url, timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export {
  getFallbackImage,
  isSupabaseUrl,
  getBestImageUrl,
  isValidImageUrl,
  loadImage,
  testImageAccess
};
