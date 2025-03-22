import { NextResponse } from "next/server";
import { checkUserState, ensureUserExists } from "@/lib/user-sync";

export async function GET() {
  try {
    // Check current user state
    const userState = await checkUserState();
    
    return NextResponse.json(userState);
  } catch (error) {
    console.error("[USER_CHECK_GET]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Force create/sync the user
    const user = await ensureUserExists();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to create user or not authenticated" 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "User synchronized successfully",
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error("[USER_CHECK_POST]", error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
