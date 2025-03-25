import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 encoded image to Cloudinary
 * 
 * @param base64Image Base64 encoded image data
 * @param fileName Name to use for the uploaded file
 * @returns URL of the uploaded image
 */
export async function uploadBase64Image(base64Image: string, fileName: string): Promise<string> {
  try {
    // Check if we have the necessary Cloudinary credentials
    if (!process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary API secret not configured, falling back to placeholder');
      return getPlaceholderImageUrl(fileName);
    }
    
    // Create data URL
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'characters',
      public_id: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
      overwrite: true
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    // Fallback to placeholder instead of throwing
    console.log('Falling back to placeholder image');
    return getPlaceholderImageUrl(fileName);
  }
}

/**
 * Create a placeholder image URL using Cloudinary transformations
 * This doesn't require API credentials, just uses URL transformations
 */
export function getPlaceholderImageUrl(name: string): string {
  // Generate a consistent cache key based on name
  const cacheKey = `placeholder-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  
  // Use the first letter as the initial
  const initial = encodeURIComponent(name.charAt(0).toUpperCase());
  
  // Generate a consistent color based on the name
  const bgColors = ['3B82F6', '8B5CF6', 'EC4899', 'F97316', '10B981'];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
  const bgColor = bgColors[colorIndex];
  
  // Create Cloudinary URL with text overlay
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe';
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_512,h_512,c_fill,b_rgb:${bgColor},bo_0px_solid_rgb:ffffff/l_text:Arial_250_bold:${initial},co_white,c_fit,g_center/${cacheKey}.png`;
}
