import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export async function GET(req: Request) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Test OpenAI API
    let openaiStatus = "Not configured";
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = await axios.get("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          timeout: 5000
        });
        openaiStatus = openai.status === 200 ? "Working" : `Error: ${openai.status}`;
      } catch (error: any) {
        openaiStatus = `Error: ${error.response?.status || error.message}`;
      }
    }
    
    // Test Together API
    let togetherStatus = "Not configured";
    if (process.env.TOGETHER_API_KEY) {
      try {
        const together = await axios.get("https://api.together.xyz/api/info", {
          headers: {
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`
          },
          timeout: 5000
        });
        togetherStatus = together.status === 200 ? "Working" : `Error: ${together.status}`;
      } catch (error: any) {
        togetherStatus = `Error: ${error.response?.status || error.message}`;
      }
    }
    
    // Test Cloudinary
    let cloudinaryStatus = "Not configured";
    if (process.env.CLOUDINARY_API_KEY) {
      try {
        // Simple check - just verify we can get a resource
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const cloudinary = await axios.get(
          `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe'}/ping`,
          {
            params: {
              timestamp,
              api_key: process.env.CLOUDINARY_API_KEY
            },
            timeout: 5000
          }
        );
        cloudinaryStatus = cloudinary.status === 200 ? "Working" : `Error: ${cloudinary.status}`;
      } catch (error: any) {
        cloudinaryStatus = `Error: ${error.response?.status || error.message}`;
      }
    }
    
    return NextResponse.json({
      openai: openaiStatus,
      together: togetherStatus,
      cloudinary: cloudinaryStatus,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("API diagnostics error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
