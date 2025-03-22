/**
 * Client for interacting with Together AI's API for avatar generation
 */

export async function generateAvatar(
  prompt: string,
  options?: {
    model?: string;
    width?: number;
    height?: number;
  }
) {
  const apiKey = process.env.TOGETHER_API_KEY || process.env.NEXT_PUBLIC_TOGETHER_API_KEY;
  
  if (!apiKey) {
    console.error("Together API key is missing");
    return null;
  }
  
  const model = options?.model || "stabilityai/stable-diffusion-xl-base-1.0";
  const width = options?.width || 512;
  const height = options?.height || 512;
  
  try {
    const response = await fetch("https://api.together.xyz/v1/images/generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        width,
        height,
        n: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Together API error (${response.status}): ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log("Together API response:", data);
    
    // Extract the image URL or base64 data from the response
    // The exact structure depends on Together API's response format
    return data.data?.[0]?.url || data.data?.[0]?.b64_json || null;
  } catch (error) {
    console.error("Error generating avatar with Together API:", error);
    return null;
  }
}
