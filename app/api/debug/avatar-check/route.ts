import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAvatar } from "@/lib/avatar";

// Admin authentication middleware
async function verifyAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    return false
  }

  return token.length > 0
}

export async function GET(req: Request) {
  try {
    // Only admins can use this endpoint
    const isAdmin = await verifyAdminAuth();
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const url = new URL(req.url);
    const name = url.searchParams.get("name") || "Test Character";
    const description = url.searchParams.get("description") || "a friendly adventurer";
    
    // Test the Studio Ghibli style avatar generation
    const avatarUrl = await generateAvatar(name, description);
    
    if (!avatarUrl) {
      return NextResponse.json({ 
        success: false,
        message: "Failed to generate Studio Ghibli style avatar" 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      name,
      description,
      avatarUrl,
      message: "Studio Ghibli style avatar generated successfully!"
    });
    
  } catch (error) {
    console.error("[DEBUG_AVATAR_CHECK]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
