import axios from 'axios';
import OpenAI from 'openai';
import { uploadBase64Image } from "./image-upload";
import { serverEnv } from './env-config';

const avatarCache: Record<string, string> = {};

let lastRequestTime = 0;
let consecutiveRateLimits = 0;
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 10000;

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'placeholder';

const WORKER_URL = process.env.IMAGE_GENERATION_WORKER_URL || 'https://api.together.xyz/v1/images/generations';

let togetherApiAuthenticated = true;

export async function generateAvatar(name: string, description?: string): Promise<string | null> {
  try {
    const cacheKey = `avatar-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    
    const existingUrl = await checkCloudinaryCache(cacheKey);
    if (existingUrl) {
      console.log(`Using existing Cloudinary avatar for ${name}: ${existingUrl}`);
      return existingUrl;
    }

    const prompt = getAvatarPrompt(name, description);
    
    if (process.env.TOGETHER_API_KEY) {
      console.log("Using Together API for avatar generation");
      try {
        const response = await axios.post(
          WORKER_URL,
          {
            model: "black-forest-labs/FLUX.1-dev",
            prompt,
            width: 512,
            height: 512,
            steps: 28,
            n: 1,
            response_format: "url"
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (response.data?.data?.[0]?.url) {
          const togetherUrl = response.data.data[0].url;
          console.log(`Generated Together API URL: ${togetherUrl}`);
          
          const cloudinaryUrl = await uploadToCloudinary(togetherUrl, name);
          if (cloudinaryUrl) {
            console.log(`Successfully converted to Cloudinary URL: ${cloudinaryUrl}`);
            avatarCache[cacheKey] = cloudinaryUrl;
            return cloudinaryUrl;
          } else {
            console.error("Failed to upload to Cloudinary, falling back to placeholder");
            return await getPlaceholderAvatar(name);
          }
        }
      } catch (error) {
        console.error("Together API error:", error);
      }
    }
    
    if (process.env.OPENAI_API_KEY) {
      console.log("Falling back to OpenAI for avatar generation");
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.images.generate({
          prompt,
          n: 1,
          size: "512x512",
          response_format: "b64_json",
        });

        const imageData = response.data[0]?.b64_json;
        if (!imageData) {
          throw new Error("No image data received from API");
        }

        const imageUrl = await uploadBase64Image(imageData, cacheKey);
        
        avatarCache[cacheKey] = imageUrl;
        
        return imageUrl;
      } catch (error) {
        console.error("OpenAI avatar generation error:", error);
        return await getPlaceholderAvatar(name);
      }
    }

    return await getPlaceholderAvatar(name);
  } catch (error) {
    console.error("Avatar generation error:", error);
    
    try {
      return await getPlaceholderAvatar(name);
    } catch (placeholderError) {
      console.error("Failed to generate placeholder:", placeholderError);
      return null;
    }
  }
}

async function uploadToCloudinary(imageUrl: string, name: string): Promise<string | null> {
  if (!imageUrl) return null;
  
  if (imageUrl.includes(`res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`)) {
    return imageUrl;
  }
  
  try {
    console.log(`Uploading to Cloudinary from URL: ${imageUrl}`);
    
    const cacheKey = `avatar-${name}`.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    const formData = new FormData();
    formData.append("file", imageUrl);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("public_id", cacheKey);
    
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`Failed to upload to Cloudinary: ${errorText}`);
      return null;
    }
    
    const result = await uploadResponse.json();
    console.log(`Successfully uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading to Cloudinary:`, error);
    return null;
  }
}

async function checkCloudinaryCache(cacheKey: string): Promise<string | null> {
  try {
    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cacheKey}.png`;
    const response = await fetch(cloudinaryUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log(`Found cached avatar in Cloudinary: ${cacheKey}`);
      return cloudinaryUrl;
    }
    return null;
  } catch (error) {
    console.error("Error checking Cloudinary cache:", error);
    return null;
  }
}

async function getPlaceholderAvatar(name: string): Promise<string | null> {
  try {
    const cacheKey = `placeholder-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    
    const initial = encodeURIComponent(name.charAt(0).toUpperCase());
    
    const bgColors = ['3B82F6', '8B5CF6', 'EC4899', 'F97316', '10B981'];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
    const bgColor = bgColors[colorIndex];
    
    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_512,h_512,c_fill,b_rgb:${bgColor},bo_0px_solid_rgb:ffffff/l_text:Arial_250_bold:${initial},co_white,c_fit,g_center/${cacheKey}.png`;
    
    return cloudinaryUrl;
  } catch (error) {
    console.error("Error creating placeholder:", error);
    return null;
  }
}

function getAvatarPrompt(name: string, description?: string): string {
  let prompt = `Authentic Studio Ghibli character portrait of ${name}`;
  
  if (description && description.trim().length > 0) {
    prompt += `, who is ${description}`;
  }
  
  prompt += `Studio Ghibli animation style, matching the naturalistic and grounded aesthetic of films like My Neighbor Totoro and Kikis Delivery Service. 
  Key Ghibli features: round face with a small nose and mouth, large expressive eyes with subtle highlights, clean and simple linework, soft watercolor-like shading, 
  and a natural earth-toned color palette. Hair should be slightly messy yet detailed with individual strands, and facial features should remain minimalist. 
  The character must have a gentle, innocent Miyazaki-style expression, shown in a 3/4 view. Draw the character exactly as described in the provided character description, 
  ensuring they look like they were designed by Studio Ghibli animators for an actual film. Background should be colorful, lush, and detailed, reflecting a practical yet whimsical setting
  (e.g., a small-town scene or something you see fit according to their description). Avoid exaggerated anime tropes; maintain Ghibli’s subdued, heartfelt, and naturalistic approach to character design.`;
  
  return prompt;
}

export async function ensureCloudinaryAvatar(togetherUrl: string, name: string): Promise<string> {
  const CLOUDINARY_CLOUD_NAME = "dht33kdwe"; 
  const CLOUDINARY_UPLOAD_PRESET = "placeholder";
  
  if (togetherUrl.includes(`res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`)) {
    return togetherUrl;
  }
  
  try {
    console.log(`Converting Together URL to Cloudinary: ${togetherUrl}`);
    
    const cacheKey = `avatar-${name}`.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    const formData = new FormData();
    formData.append("file", togetherUrl);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("public_id", cacheKey);
    
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );
    
    if (!uploadResponse.ok) {
      console.error(`Failed to upload to Cloudinary: ${await uploadResponse.text()}`);
      return togetherUrl;
    }
    
    const result = await uploadResponse.json();
    console.log(`Successfully converted to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
    
  } catch (error) {
    console.error(`Error uploading to Cloudinary:`, error);
    return togetherUrl;
  }
}

export const getAvatarCache = () => avatarCache;

export const resetRateLimitTracking = () => {
  consecutiveRateLimits = 0;
};

export const validateTogetherApiKey = async (): Promise<boolean> => {
  return !!process.env.TOGETHER_API_KEY;
};
