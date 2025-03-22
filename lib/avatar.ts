import axios from 'axios';
import OpenAI from 'openai';
import { uploadBase64Image } from "./image-upload";
import { serverEnv } from './env-config';

// In-memory cache for avatar URLs to avoid repeated API calls
const avatarCache: Record<string, string> = {};

// Track rate limiting to implement exponential backoff
let lastRequestTime = 0;
let consecutiveRateLimits = 0;
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 10000;

// Cloudinary configuration constants
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe'; // Default for development
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'placeholder';

// Worker URL for image generation
const WORKER_URL = process.env.IMAGE_GENERATION_WORKER_URL || 'https://api.together.xyz/v1/images/generations';

// Track API authentication status to avoid repeated failed calls
let togetherApiAuthenticated = true; // Start optimistic, will turn false if auth fails

/**
 * Generates an avatar for a character using the configured image generation service
 * 
 * @param name Character name
 * @param description Optional character description
 * @returns URL of the generated image or null if generation failed
 */
export async function generateAvatar(name: string, description?: string): Promise<string | null> {
  try {
    // Generate a cache key for this character
    const cacheKey = `avatar-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    
    // Check if we already have this avatar in cache
    const existingUrl = await checkCloudinaryCache(cacheKey);
    if (existingUrl) {
      console.log(`Using existing Cloudinary avatar for ${name}: ${existingUrl}`);
      return existingUrl;
    }

    // Create a detailed prompt based on character info
    const prompt = getAvatarPrompt(name, description);
    
    // Use the worker URL for image generation
    if (process.env.TOGETHER_API_KEY) {
      // Use Together API
      console.log("Using Together API for avatar generation");
      try {
        const response = await axios.post(
          WORKER_URL,
          {
            model: "black-forest-labs/FLUX.1-dev", // Or your preferred model
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
          const imageUrl = response.data.data[0].url;
          // Cache the URL
          avatarCache[cacheKey] = imageUrl;
          return imageUrl;
        }
      } catch (error) {
        console.error("Together API error:", error);
      }
    }
    
    // Fallback to OpenAI if Together API fails or is not configured
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

        // Get base64 image data
        const imageData = response.data[0]?.b64_json;
        if (!imageData) {
          throw new Error("No image data received from API");
        }

        // Upload the image to Cloudinary
        const imageUrl = await uploadBase64Image(imageData, cacheKey);
        
        // Cache the URL
        avatarCache[cacheKey] = imageUrl;
        
        return imageUrl;
      } catch (error) {
        console.error("OpenAI avatar generation error:", error);
      }
    }

    // If both methods fail, generate a placeholder
    return await getPlaceholderAvatar(name);
  } catch (error) {
    console.error("Avatar generation error:", error);
    
    // Try to generate a placeholder instead
    try {
      return await getPlaceholderAvatar(name);
    } catch (placeholderError) {
      console.error("Failed to generate placeholder:", placeholderError);
      return null;
    }
  }
}

/**
 * Check if an image already exists in Cloudinary cache
 */
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

/**
 * Generate a placeholder avatar using Cloudinary for consistency
 */
async function getPlaceholderAvatar(name: string): Promise<string | null> {
  try {
    // Generate a consistent cache key based on name
    const cacheKey = `placeholder-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    
    // Use the first letter as the initial
    const initial = encodeURIComponent(name.charAt(0).toUpperCase());
    
    // Generate a consistent color based on the name
    const bgColors = ['3B82F6', '8B5CF6', 'EC4899', 'F97316', '10B981'];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
    const bgColor = bgColors[colorIndex];
    
    // Create Cloudinary URL with text overlay
    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_512,h_512,c_fill,b_rgb:${bgColor},bo_0px_solid_rgb:ffffff/l_text:Arial_250_bold:${initial},co_white,c_fit,g_center/${cacheKey}.png`;
    
    return cloudinaryUrl;
  } catch (error) {
    console.error("Error creating placeholder:", error);
    return null;
  }
}

/**
 * Creates a detailed prompt for avatar generation
 */
function getAvatarPrompt(name: string, description?: string): string {
  // Base prompt template
  let prompt = `High quality, professional portrait image for a character named ${name}`;
  
  // Add details from description if available
  if (description && description.trim().length > 0) {
    prompt += `, who is ${description}`;
  }
  
  // Add styles and quality instructions
  prompt += `. Digital art style, detailed facial features, high resolution, professional lighting, neutral expression, looking at viewer.`;
  
  return prompt;
}

// Export utility functions
export const getAvatarCache = () => avatarCache;

export const resetRateLimitTracking = () => {
  consecutiveRateLimits = 0;
};

export const validateTogetherApiKey = async (): Promise<boolean> => {
  return !!process.env.TOGETHER_API_KEY;
};
