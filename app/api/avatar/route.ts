import { NextResponse } from "next/server";
import { generateAvatar, getAvatarCache, resetRateLimitTracking } from "@/lib/avatar";
import { PrismaClient } from "@prisma/client";

// Use nodejs runtime for better compatibility with avatar generation
export const runtime = 'nodejs';

const prisma = new PrismaClient();

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

// Generate a placeholder avatar using a character's initial or name
async function getPlaceholderAvatar(name: string): Promise<string | null> {
  try {
    // Use RoboHash as a reliable fallback that works without auth
    return `https://robohash.org/${encodeURIComponent(name)}?set=set4`;
  } catch (error) {
    console.error("Failed to generate placeholder avatar:", error);
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "Anonymous";
  const description = url.searchParams.get("description") || undefined;
  const width = url.searchParams.get("width") || "256";
  const height = url.searchParams.get("height") || "256";
  const checkDb = url.searchParams.get("checkDb") !== "false"; // Default to true
  // New parameter to control fallback behavior
  const allowRobohashFallback = url.searchParams.get("allowRobohashFallback") === "true"; // Default to false
  
  console.log(`Avatar API: Requested avatar for ${name}`, { 
    checkDb, 
    env: process.env.NODE_ENV 
  });
  
  // Generate cache key that includes description if available
  const cacheKey = `avatar-${name}${description ? `-${description}` : ''}`;
  
  // Check persistent cache first
  if (persistentCache[cacheKey]) {
    console.log("Avatar API: Using persistently cached avatar for:", name);
    return NextResponse.redirect(persistentCache[cacheKey]);
  }
  
  // Also check the in-memory cache from the avatar module
  const avatarCache = getAvatarCache();
  if (avatarCache[cacheKey]) {
    console.log("Avatar API: Using module cached avatar for:", name);
    persistentCache[cacheKey] = avatarCache[cacheKey];
    return NextResponse.redirect(avatarCache[cacheKey]);
  }
  
  // Try to find a stored avatar URL in the database first
  if (checkDb) {
    try {
      // Check HomeCharacter table first
      const homeChar = await prisma.homeCharacter.findFirst({
        where: { name },
        select: { imageUrl: true }
      });
      
      if (homeChar?.imageUrl && isValidImageUrl(homeChar.imageUrl)) {
        console.log("Avatar API: Found valid HomeCharacter imageUrl for:", name);
        persistentCache[cacheKey] = homeChar.imageUrl;
        return NextResponse.redirect(homeChar.imageUrl);
      } else if (homeChar?.imageUrl) {
        console.log("Avatar API: Found HomeCharacter imageUrl but invalid format:", homeChar.imageUrl);
      }
      
      // Also check Character table
      const character = await prisma.character.findFirst({
        where: { name },
        select: { imageUrl: true }
      });
      
      if (character?.imageUrl && isValidImageUrl(character.imageUrl)) {
        console.log("Avatar API: Found valid Character imageUrl for:", name);
        persistentCache[cacheKey] = character.imageUrl;
        return NextResponse.redirect(character.imageUrl);
      } else if (character?.imageUrl) {
        console.log("Avatar API: Found Character imageUrl but invalid format:", character.imageUrl);
      }
    } catch (error) {
      console.error("Avatar API: Error checking database for stored avatar:", error);
      // Continue with normal flow if database check fails
    }
  }

  // Make sure we bypass authentication checks for public avatars
  // This will ensure avatars work in incognito mode
  const isPublicAvatar = true; // Set this to true to allow public access

  // Reset rate limit tracking if it's been a while since the last request
  // This allows the system to recover after periods of inactivity
  const now = Date.now();
  const lastRequestTime = global.lastAvatarRequestTime || 0;
  if (now - lastRequestTime > 10000) {
    resetRateLimitTracking();
  }
  
  // Update last request time
  global.lastAvatarRequestTime = now;
  
  // Clear any existing timer and set a new one to reset rate limiting after 30 seconds of inactivity
  if (global.rateLimitResetTimer) {
    clearTimeout(global.rateLimitResetTimer);
  }
  global.rateLimitResetTimer = setTimeout(() => {
    resetRateLimitTracking();
  }, 30000);
  
  // Try to generate with Together API
  try {
    console.log("Avatar API: Attempting to generate avatar for:", name);
    
    if (process.env.TOGETHER_API_KEY) {
      const avatarUrl = await generateAvatar(name, description);
      
      if (avatarUrl) {
        // Store in persistent cache
        persistentCache[cacheKey] = avatarUrl;
        console.log("Avatar API: Generated Together avatar:", avatarUrl);
        
        return NextResponse.redirect(avatarUrl);
      }
    }
  } catch (error: any) {
    console.error("Avatar API: Avatar generation failed:", error);
  }
  
  // Only use Robohash fallback if explicitly allowed
  if (allowRobohashFallback) {
    console.log("Avatar API: Using Robohash fallback for:", name);
    const robohashUrl = `https://robohash.org/${encodeURIComponent(name)}?size=${width}x${height}&set=set4`;
    persistentCache[cacheKey] = robohashUrl;
    return NextResponse.redirect(robohashUrl);
  }

  // Always generate a default avatar, even if rate-limited
  try {
    // Use Cloudinary for avatar generation as it doesn't require auth
    const cloudinaryUrl = await getPlaceholderAvatar(name);
    if (cloudinaryUrl) {
      // Cache the result
      persistentCache[cacheKey] = cloudinaryUrl;
      return NextResponse.redirect(cloudinaryUrl);
    }
  } catch (error) {
    console.error("Avatar API: Failed to generate placeholder avatar:", error);
  }
  
  // Ultimate fallback: use RoboHash (works without auth)
  const robohashUrl = `https://robohash.org/${encodeURIComponent(name)}?size=${width}x${height}&set=set4`;
  persistentCache[cacheKey] = robohashUrl;
  return NextResponse.redirect(robohashUrl);
  
  // No fallback - return a transparent 1x1 pixel image
  console.log("Avatar API: No image available and fallbacks disabled for:", name);
  return new NextResponse(null, { 
    status: 204, // No content
    headers: {
      'Content-Type': 'image/gif',
    }
  });
}