import { NextResponse } from "next/server";
import { generateAvatar, getAvatarCache, resetRateLimitTracking } from "@/lib/avatar";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

// Use nodejs runtime for better compatibility with avatar generation
export const runtime = 'nodejs';

const prisma = new PrismaClient();

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dht33kdwe"; // Replace with your actual cloud name if different
const CLOUDINARY_API_KEY = "524243793517948"; // Replace with your actual API key
const CLOUDINARY_UPLOAD_PRESET = "placeholder"; // Replace with your actual upload preset

// Declare the global property to fix TypeScript error
declare global {
  var lastAvatarRequestTime: number | undefined;
  var rateLimitResetTimer: NodeJS.Timeout | undefined;
}

// Global avatar cache map persists between requests in development
// In production, consider using Redis or another persistent cache
const persistentCache: Record<string, string> = {};

// Helper to validate URLs to prevent broken images
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Must be an absolute URL for production environments
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
    console.log('Avatar API: Invalid URL format (not absolute)', url);
    return false;
  }
  
  // Simple validation - should be improved for production
  if (url.includes('undefined') || url.includes('[object Object]')) {
    console.log('Avatar API: Invalid URL content', url);
    return false;
  }
  
  return true;
}

// Check if a URL is from Together AI and should be converted to Cloudinary
function isTogetherAiUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('api.together.ai') || url.includes('together.xyz');
}

// Generate a Cloudinary cache key from name and description
function generateCacheKey(name: string, description?: string): string {
  // Create a consistent, URL-safe cache key
  const baseKey = `avatar-${name}${description ? `-${description.substring(0, 20)}` : ''}`;
  return baseKey.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

// Check if an image already exists in Cloudinary cache
async function checkCloudinaryCache(cacheKey: string): Promise<string | null> {
  try {
    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cacheKey}.png`;
    console.log(`Checking Cloudinary for cached image at: ${cloudinaryUrl}`);
    
    // Just check if the URL exists
    const response = await fetch(cloudinaryUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log(`Found cached image in Cloudinary for ${cacheKey}`);
      return cloudinaryUrl;
    }
    
    console.log(`No cached image found in Cloudinary for ${cacheKey}`);
    return null;
  } catch (error) {
    console.error(`Error checking Cloudinary cache: ${error}`);
    return null;
  }
}

// Generate a placeholder avatar using Cloudinary
async function getPlaceholderAvatar(name: string): Promise<string | null> {
  try {
    // Create a simple text-based avatar in Cloudinary
    const cacheKey = generateCacheKey(name);
    const firstChar = encodeURIComponent(name.charAt(0).toUpperCase());
    
    // Use transformation URL to create a text-based avatar
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill,r_max/l_text:arial_80:${firstChar},co_white,w_120,h_120,c_fit/fl_layer_apply,g_center,x_0,y_0/e_shadow/w_200,h_200/${cacheKey}.png`;
  } catch (error) {
    console.error("Failed to generate placeholder avatar:", error);
    return null;
  }
}

// Upload an image from URL to Cloudinary
async function uploadUrlToCloudinary(imageUrl: string, cacheKey: string): Promise<string | null> {
  try {
    console.log(`Uploading image to Cloudinary from URL: ${imageUrl}`);
    
    // Force a direct approach using fetch to ensure we upload correctly
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
      console.error(`Failed to upload to Cloudinary: ${await uploadResponse.text()}`);
      return null;
    }
    
    const result = await uploadResponse.json();
    console.log(`Successfully uploaded to Cloudinary with URL: ${result.secure_url}`);
    
    // Return the Cloudinary URL explicitly
    return result.secure_url || `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cacheKey}.png`;
    
  } catch (error) {
    console.error(`Error uploading to Cloudinary:`, error);
    return null;
  }
}

// Modified function that ensures Together API URLs are always converted to Cloudinary
async function ensureCloudinaryUrl(url: string, name: string, description?: string): Promise<string> {
  // Skip processing if it's already a Cloudinary URL
  if (url && url.includes(`res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`)) {
    console.log("URL is already a Cloudinary URL, returning as-is:", url);
    return url;
  }
  
  // If it's a Together API URL, convert it to Cloudinary
  if (isTogetherAiUrl(url)) {
    console.log("Converting Together AI URL to Cloudinary:", url);
    
    const cacheKey = generateCacheKey(name, description);
    const cloudinaryUrl = await uploadUrlToCloudinary(url, cacheKey);
    
    if (cloudinaryUrl) {
      console.log("Successfully converted to Cloudinary URL:", cloudinaryUrl);
      return cloudinaryUrl;
    } else {
      console.error("Failed to convert Together AI URL to Cloudinary, using fallback");
      // Return a placeholder if conversion fails
      const placeholder = await getPlaceholderAvatar(name);
      return placeholder || `https://robohash.org/${encodeURIComponent(name)}?set=set4`;
    }
  }
  
  // If it's not a Together API URL, return it as is
  return url;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "Anonymous";
  const description = url.searchParams.get("description") || undefined;
  const width = url.searchParams.get("width") || "256";
  const height = url.searchParams.get("height") || "256";
  const checkDb = url.searchParams.get("checkDb") !== "false"; // Default to true
  const allowRobohashFallback = url.searchParams.get("allowRobohashFallback") === "true"; // Default to false
  
  console.log(`Avatar API: Requested avatar for ${name}`, { 
    checkDb, 
    env: process.env.NODE_ENV 
  });
  
  // Generate a consistent cache key
  const cacheKey = generateCacheKey(name, description);
  
  // Check persistent cache first
  if (persistentCache[cacheKey]) {
    const finalUrl = await ensureCloudinaryUrl(persistentCache[cacheKey], name, description);
    console.log("Avatar API: Using cached URL (ensured Cloudinary):", finalUrl);
    return NextResponse.redirect(finalUrl);
  }
  
  // Also check the in-memory cache from the avatar module
  const avatarCache = getAvatarCache();
  if (avatarCache[cacheKey]) {
    const finalUrl = await ensureCloudinaryUrl(avatarCache[cacheKey], name, description);
    console.log("Avatar API: Using module cached avatar (ensured Cloudinary):", finalUrl);
    persistentCache[cacheKey] = finalUrl;
    return NextResponse.redirect(finalUrl);
  }
  
  // Check Cloudinary cache first
  const cloudinaryUrl = await checkCloudinaryCache(cacheKey);
  if (cloudinaryUrl) {
    console.log("Avatar API: Using Cloudinary cached avatar for:", name);
    persistentCache[cacheKey] = cloudinaryUrl;
    return NextResponse.redirect(cloudinaryUrl);
  }
  
  // Try to find a stored avatar URL in the database if no Cloudinary cache
  if (checkDb) {
    try {
      // Check HomeCharacter table first
      const homeChar = await prisma.homeCharacter.findFirst({
        where: { name },
        select: { imageUrl: true }
      });
      
      if (homeChar?.imageUrl && isValidImageUrl(homeChar.imageUrl)) {
        const finalUrl = await ensureCloudinaryUrl(homeChar.imageUrl, name, description);
        console.log("Avatar API: Using HomeCharacter URL (ensured Cloudinary):", finalUrl);
        persistentCache[cacheKey] = finalUrl;
        return NextResponse.redirect(finalUrl);
      }
      
      // Also check Character table
      const character = await prisma.character.findFirst({
        where: { name },
        select: { imageUrl: true }
      });
      
      if (character?.imageUrl && isValidImageUrl(character.imageUrl)) {
        const finalUrl = await ensureCloudinaryUrl(character.imageUrl, name, description);
        console.log("Avatar API: Using Character URL (ensured Cloudinary):", finalUrl);
        persistentCache[cacheKey] = finalUrl;
        return NextResponse.redirect(finalUrl);
      }
    } catch (error) {
      console.error("Avatar API: Error checking database for stored avatar:", error);
    }
  }

  // Reset rate limit tracking if it's been a while
  const now = Date.now();
  const lastRequestTime = global.lastAvatarRequestTime || 0;
  if (now - lastRequestTime > 10000) {
    resetRateLimitTracking();
  }
  
  // Update last request time
  global.lastAvatarRequestTime = now;
  
  // Clear any existing timer and set a new one
  if (global.rateLimitResetTimer) {
    clearTimeout(global.rateLimitResetTimer);
  }
  global.rateLimitResetTimer = setTimeout(() => {
    resetRateLimitTracking();
  }, 30000);

  // Try to generate with Together API and ALWAYS convert to Cloudinary
  if (process.env.TOGETHER_API_KEY) {
    try {
      console.log("Avatar API: Generating avatar with Together AI for:", name);
      
      const togetherAvatarUrl = await generateAvatar(name, description);
      
      if (togetherAvatarUrl) {
        console.log("Avatar API: Generated Together API URL:", togetherAvatarUrl);
        
        // NEVER return the Together URL directly
        const cloudinaryAvatarUrl = await uploadUrlToCloudinary(togetherAvatarUrl, cacheKey);
        
        if (cloudinaryAvatarUrl) {
          console.log("Avatar API: Successfully uploaded to Cloudinary:", cloudinaryAvatarUrl);
          persistentCache[cacheKey] = cloudinaryAvatarUrl;
          return NextResponse.redirect(cloudinaryAvatarUrl);
        } else {
          console.error("Avatar API: Failed to upload Together result to Cloudinary");
        }
      }
    } catch (error: any) {
      console.error("Avatar API: Together API avatar generation failed:", error);
    }
  }
  
  // Try to generate a Cloudinary placeholder directly
  try {
    const placeholderUrl = await getPlaceholderAvatar(name);
    if (placeholderUrl) {
      console.log("Avatar API: Using Cloudinary placeholder for:", name);
      persistentCache[cacheKey] = placeholderUrl;
      return NextResponse.redirect(placeholderUrl);
    }
  } catch (error) {
    console.error("Avatar API: Failed to generate Cloudinary placeholder:", error);
  }
  
  // Ultimate fallback: use RoboHash uploaded to Cloudinary
  const robohashUrl = `https://robohash.org/${encodeURIComponent(name)}?size=${width}x${height}&set=set4`;
  
  try {
    // Always try to upload Robohash to Cloudinary first
    const robohashCloudinaryUrl = await uploadUrlToCloudinary(robohashUrl, `robohash-${cacheKey}`);
    if (robohashCloudinaryUrl) {
      console.log("Avatar API: Using Robohash uploaded to Cloudinary:", robohashCloudinaryUrl);
      persistentCache[cacheKey] = robohashCloudinaryUrl;
      return NextResponse.redirect(robohashCloudinaryUrl);
    }
  } catch (error) {
    console.error("Avatar API: Failed to upload Robohash to Cloudinary:", error);
  }
  
  // If absolutely everything else fails
  console.log("Avatar API: Using direct Robohash as last resort:", robohashUrl);
  persistentCache[cacheKey] = robohashUrl;
  return NextResponse.redirect(robohashUrl);
}