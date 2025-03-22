import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

// Admin authentication middleware
async function verifyAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    return false
  }

  // Verify the token (simplified check)
  return token.length > 0
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    
    const character = await prisma.homeCharacter.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    return NextResponse.json(character)
  } catch (error) {
    console.error("[ADMIN_HOME_CHARACTER_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    const { name, description, category, displayOrder } = await req.json()
    
    // Validate inputs
    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }
    
    // Check if character exists
    const character = await prisma.homeCharacter.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    // Update the character
    const updatedCharacter = await prisma.homeCharacter.update({
      where: { id },
      data: {
        name,
        description,
        category: category || character.category,
        displayOrder: displayOrder !== undefined ? displayOrder : character.displayOrder
      }
    })
    
    return NextResponse.json(updatedCharacter)
  } catch (error) {
    console.error("[ADMIN_HOME_CHARACTER_UPDATE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    
    // Check if character exists
    const character = await prisma.homeCharacter.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    // Delete the character
    await prisma.homeCharacter.delete({
      where: { id }
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ADMIN_HOME_CHARACTER_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
