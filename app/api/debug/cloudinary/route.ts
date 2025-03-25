import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { generateAvatar } from "@/lib/avatar";

const prisma = new PrismaClient();

// Set runtime to nodejs for API access
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // Check auth - only allow admin/authorized users
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Return Cloudinary configuration details
    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe',
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'placeholder',
      apiKeyLastFour: process.env.CLOUDINARY_API_KEY ? 
        `...${process.env.CLOUDINARY_API_KEY.slice(-4)}` : null,
      uploadCredentialsComplete: !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    });
  } catch (error) {
    console.error("Error checking Cloudinary config:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Check auth - only allow admin/authorized users
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get parameters from request body
    const { name, description } = await req.json();
    
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    
    console.log(`Debug Cloudinary upload for "${name}" with description "${description || 'none'}"`);
    
    // Generate a test avatar with Cloudinary integration
    const startTime = Date.now();
    const imageUrl = await generateAvatar(name, description);
    const duration = Date.now() - startTime;
    
    // Return the result
    return NextResponse.json({
      success: !!imageUrl,
      imageUrl,
      durationMs: duration,
      name,
      description: description || null
    });
  } catch (error) {
    console.error("Error testing Cloudinary avatar generation:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
