import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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

    // SimliAgent API call
    const simliResponse = await fetch(
      "https://api.simli.ai/session/1b250748-fbee-470f-9db1-af01fe567c79/gAAAAABn4_OHIv4eIgTr1r71hXqQdgTfnHX99Na6aIizP-wKIds0juXhDwU2c7nfjvoWQQraNDHEjRbl8PwyEPCR_JGE_PrHOsVD2K348OIZp1K-h2tKmptmsdpDTRSkdnBAMvppJjfTqGpRANQqkpepFKz-bXi2wZVxCxQh5T2NwNFrOWYccBwkb4l37he2xwSacWDEr2-h60G8zUAUmBhYydBWFw6_j8e7LHls_IV6zKjomF4zMnL4_HGHcq0D4ggijRP0fwLM8ngJyZr2RFK0Pj8hSwqlNTjLys7pW8iuYelKgK4pr5YoyhAklFl7sPZwHreXFgaQNuxbkIAOMMjATHt9B6QGJOM59loR2YVkSSfbpeYzv6lx95gnh7kCi8j99C2tlWKYasnfLM8EaD5R0CcHbnF22g==",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("SimliAgent API response status:", simliResponse.status);

    if (!simliResponse.ok) {
      const errorText = await simliResponse.text();
      console.error("SimliAgent API error:", errorText);
      throw new Error("Failed to fetch room URL from SimliAgent");
    }

    const simliData = await simliResponse.json();
    console.log("SimliAgent API response data:", simliData);

    const roomUrl = simliData.roomUrl;

    if (!roomUrl) {
      console.error("Room URL is missing in SimliAgent response");
      throw new Error("Room URL is missing in SimliAgent response");
    }

    // Verify the room URL is accessible
    const headResponse = await fetch(roomUrl, { method: "HEAD" });
    if (!headResponse.ok) {
      console.error("Room URL is not accessible:", roomUrl);
      throw new Error("Room URL is not accessible");
    }

    console.log("Room URL is accessible:", roomUrl);

    // Return the room URL
    return NextResponse.json({ roomUrl });
  } catch (error) {
    console.error("Error in /api/video/start-session:", error);
    return NextResponse.json(
      { error: "Failed to start video session" },
      { status: 500 }
    );
  }
}
