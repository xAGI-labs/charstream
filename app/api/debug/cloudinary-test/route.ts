import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export async function GET(req: Request) {
  try {
    // Basic auth check
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");
    
    if (!imageUrl) {
      return new NextResponse("URL parameter required", { status: 400 });
    }
    
    // First, just try to fetch the image metadata
    let headResult: { ok?: boolean, status?: number, error?: string } = {};
    try {
      const headResponse = await fetch(imageUrl, { method: "HEAD" });
      headResult = {
        ok: headResponse.ok,
        status: headResponse.status
      };
    } catch (error) {
      headResult = {
        ok: false,
        error: String(error)
      };
    }
    
    // Then try to fetch the actual image
    let getResult: { ok?: boolean, status?: number, contentType?: string, error?: string } = {};
    try {
      const getResponse = await fetch(imageUrl);
      getResult = {
        ok: getResponse.ok,
        status: getResponse.status,
        contentType: getResponse.headers.get("content-type") || undefined
      };
    } catch (error) {
      getResult = {
        ok: false,
        error: String(error)
      };
    }
    
    // Return the diagnosis results
    return NextResponse.json({
      imageUrl,
      headRequest: headResult,
      getRequest: getResult,
      cloudinaryDomain: imageUrl.includes('cloudinary'),
      isCloudinaryFormat: imageUrl.includes('res.cloudinary.com') || imageUrl.includes('.cloudinary.com'),
      nextJsConfig: {
        domains: [
          'robohash.org',
          'img.clerk.com', 
          'together.xyz',
          'api.together.xyz',
          'api.together.ai',
          'res.cloudinary.com',
          'dht33kdwe.cloudinary.com'
        ]
      }
    });
  } catch (error) {
    console.error("Cloudinary test error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
