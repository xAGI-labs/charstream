// Create a new file for image proxying (helpful for Cloudinary URLs)

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");
  
  if (!imageUrl) {
    return new NextResponse("Image URL is required", { status: 400 });
  }
  
  try {
    // Validate URL to prevent security issues
    const validDomains = [
      'together.xyz',
      'api.together.xyz',
      'res.cloudinary.com',
      'dht33kdwe.cloudinary.com',
    ];
    
    const urlObj = new URL(imageUrl);
    const isValidDomain = validDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
    
    if (!isValidDomain) {
      console.warn(`Image proxy: Invalid domain requested: ${urlObj.hostname}`);
      return new NextResponse("Invalid image domain", { status: 403 });
    }
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    // Get content type and image data
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageData = await response.arrayBuffer();
    
    // Return the image with proper content type
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Error processing image", { status: 500 });
  }
}
