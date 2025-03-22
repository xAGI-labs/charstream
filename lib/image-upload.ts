import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
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
    throw new Error('Failed to upload image');
  }
}
