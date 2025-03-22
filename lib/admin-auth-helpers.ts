import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

/**
 * Verify if the current request is from an authenticated admin
 * This is a server-side function
 */
export async function verifyAdminAuth(): Promise<boolean> {
  try {
    // Get the admin token from cookies
    // Note: cookies() returns the cookie store directly, no need to await
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;

    if (!adminToken) {
      return false;
    }

    // Verify the JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    try {
      const { payload } = await jwtVerify(adminToken, secret);
      
      // Check if the token contains admin username
      if (payload.username === ADMIN_USERNAME) {
        return true;
      }
    } catch (error) {
      console.error("Admin JWT verification failed:", error);
      return false;
    }

    return false;
  } catch (error) {
    console.error("Error verifying admin auth:", error);
    return false;
  }
}

/**
 * Validates admin credentials against environment variables
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
