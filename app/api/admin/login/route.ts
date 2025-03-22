import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sign } from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    // Get credentials from request body
    const { username, password } = await req.json();

    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.ADMIN_JWT_SECRET;

    // Check if required environment variables are set
    if (!adminUsername || !adminPassword || !jwtSecret) {
      console.error("Admin credentials or JWT secret not configured in .env");
      return NextResponse.json(
        { error: "Server configuration error" }, 
        { status: 500 }
      );
    }

    // Check if credentials match
    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" }, 
        { status: 401 }
      );
    }

    // Create JWT token
    const token = sign(
      { 
        username,
        role: "admin",
      }, 
      jwtSecret, 
      { expiresIn: "6h" }
    );

    // Set cookie with the token
    // Fix: await the cookies() promise before calling set
    const cookieStore = await cookies();
    cookieStore.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 6, // 6 hours
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}