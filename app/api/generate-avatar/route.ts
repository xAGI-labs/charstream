import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

// Use node runtime (not edge) for file system operations
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { name, description } = await req.json();
    
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    
    // Use Together AI to generate an avatar
    const prompt = description
      ? `A portrait of ${name}, who is ${description}. Detailed, high quality.`
      : `A portrait of a character named ${name}. Detailed, high quality.`;
    
    const response = await axios.post(
      "https://api.together.xyz/v1/images/generations",
      {
        model: "black-forest-labs/FLUX.1-dev",
        prompt,
        width: 256,
        height: 256,
        steps: 28,
        n: 1,
        response_format: "url" // Get URL directly instead of base64
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (
      !response.data ||
      !response.data.data || 
      !response.data.data[0] || 
      !response.data.data[0].url
    ) {
      return new NextResponse("Failed to generate avatar", { status: 500 });
    }
    
    const avatarUrl = response.data.data[0].url;
    return NextResponse.json({ avatarUrl });
  } catch (error: any) {
    console.error("Error in generate-avatar route:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
