// Add a route to refresh a specific character's image using Cloudinary

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { generateAvatar } from "@/lib/avatar";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { characterId } = body;
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 });
    }
    
    // Fetch the character
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 });
    }
    
    // Only allow creator to refresh image
    if (character.creatorId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Generate new image with Cloudinary integration
    const newImageUrl = await generateAvatar(character.name, character.description || undefined);
    
    if (!newImageUrl) {
      return NextResponse.json({
        success: false,
        message: "Failed to generate new image"
      }, { status: 500 });
    }
    
    // Update the character record
    await prisma.character.update({
      where: { id: characterId },
      data: { imageUrl: newImageUrl }
    });
    
    return NextResponse.json({
      success: true,
      imageUrl: newImageUrl
    });
  } catch (error) {
    console.error("Error refreshing image:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
