import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { characterId, content } = await req.json();
  if (!characterId || !content) {
    return new NextResponse("Character ID and content are required", { status: 400 });
  }

  try {
    const memory = await prisma.memory.create({
      data: {
        userId,
        characterId,
        content,
      },
    });

    return NextResponse.json(memory);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating memory:", error.message);
    } else {
      console.error("Unknown error creating memory:", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
