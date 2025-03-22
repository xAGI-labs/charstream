import { PrismaClient } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

/**
 * Ensures the current Clerk user exists in the database
 * Call this function in protected routes to create users on first access
 */
export async function ensureUserExists() {
  try {
    // Get authentication state from Clerk
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      console.log("No authenticated user found");
      return null;
    }
    
    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { id: clerkId }
    });
    
    // If not, create the user using Clerk user data
    if (!dbUser) {
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        console.error("Failed to fetch Clerk user details");
        return null;
      }
      
      console.log("Creating new user in database from Clerk:", clerkId);
      
      // Create user in database with Clerk user data
      dbUser = await prisma.user.create({
        data: {
          id: clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress || `user-${clerkId}@example.com`,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null
        }
      });
      
      console.log("User created successfully:", dbUser.id);
    }
    
    return dbUser;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return null;
  }
}

/**
 * Debug function to check user state
 */
export async function checkUserState() {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    return {
      userId,
      clerkUserExists: !!user,
      email: user?.emailAddresses[0]?.emailAddress,
      dbUserExists: userId ? !!(await prisma.user.findUnique({ where: { id: userId } })) : false
    };
  } catch (error) {
    console.error("Error checking user state:", error);
    return { error: String(error) };
  }
}
