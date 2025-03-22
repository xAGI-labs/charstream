import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" }, 
        { status: 401 }
      );
    }

    const jwtSecret = process.env.ADMIN_JWT_SECRET;

    // verify JWT token
    if (!jwtSecret) {
      console.error("Admin JWT secret not configured in .env");
      return NextResponse.json(
        { error: "Server configuration error" }, 
        { status: 500 }
      );
    }

    try {
      const decoded = verify(token, jwtSecret);
      return NextResponse.json({ 
        authenticated: true,
        user: decoded
      });
    } catch (tokenError) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" }, 
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}