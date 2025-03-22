"use server";

import { generateAvatar } from "@/lib/api/together";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function generateAndUploadAvatar(characterName: string, description: string) {
  try {
    // Generate a detailed prompt for the avatar
    const prompt = `Professional portrait avatar of a character named ${characterName}. ${description}. 
    Highly detailed, professional photograph style, looking straight at camera, shoulders up portrait, 
    photorealistic, high quality, highly detailed.`;
    
    // Generate image with Together API
    const imageData = await generateAvatar(prompt);
    
    if (!imageData) {
      console.error("Failed to generate avatar with Together API");
      return null;
    }
    
    // Upload to Cloudinary if we have image data
    let uploadResult;
    
    if (imageData.startsWith('data:')) {
      // It's a base64 image
      uploadResult = await cloudinary.uploader.upload(imageData, {
        folder: "character-avatars",
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      });
    } else {
      // It's a URL
      uploadResult = await cloudinary.uploader.upload(imageData, {
        folder: "character-avatars",
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      });
    }
    
    console.log("Cloudinary upload success:", uploadResult.secure_url);
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Avatar generation and upload failed:", error);
    return null;
  }
}
