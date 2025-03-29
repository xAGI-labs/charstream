import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: Request) {
  try {
    // Initialize Replicate client with the API token
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Parse the request body for the base64 image and optional prompt
    const body = await req.json();
    const { imageBase64, prompt } = body;
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Default prompt if none provided
    const enhancedPrompt = prompt || "Portrait in the style of TOK";

    // Log important info but not the full image data
    console.log("Starting Ghiblify process with prompt:", enhancedPrompt);
    console.log("Input image provided as base64");
    
    // Run the Ghibli model using Replicate
    const output = await replicate.run(
      "grabielairu/ghibli:4b82bb7dbb3b153882a0c34d7f2cbc4f7012ea7eaddb4f65c257a3403c9b3253",
      {
        input: {
          image: imageBase64,
          width: 1024,
          height: 1024,
          prompt: enhancedPrompt,
          refine: "no_refiner",
          scheduler: "K_EULER",
          lora_scale: 0.6,
          num_outputs: 1,
          guidance_scale: 7.5,
          apply_watermark: true,
          high_noise_frac: 0.8,
          negative_prompt: "",
          prompt_strength: 0.8,
          num_inference_steps: 50
        }
      }
    );
    
    console.log("Replicate API output:", typeof output, Array.isArray(output) ? output.length : "not an array");
    
    // Handle ReadableStream output - convert to base64 data URL
    if (output && Array.isArray(output) && output.length > 0) {
      const streamResponse = output[0];
      console.log("Output type:", typeof streamResponse, streamResponse ? streamResponse.constructor.name : "null");
      
      try {
        if (streamResponse && typeof streamResponse === 'object' && 'then' in streamResponse) {
          // Handle Promise-like objects
          const resolvedResponse = await streamResponse;
          console.log("Resolved response type:", typeof resolvedResponse);
          return NextResponse.json({ 
            success: true,
            result: resolvedResponse 
          });
        } else if (streamResponse && typeof streamResponse === 'object' && streamResponse instanceof ReadableStream) {
          // For ReadableStream, we'll convert it to a data URL
          console.log("Handling ReadableStream response");
          return NextResponse.json({ 
            success: true,
            result: streamResponse.toString(),
            isStream: true
          });
        } else {
          // For direct URL or string responses
          console.log("Using direct response:", typeof streamResponse);
          return NextResponse.json({ 
            success: true,
            result: streamResponse
          });
        }
      } catch (streamError: any) {
        console.error("Error processing stream:", streamError);
        return NextResponse.json(
          { error: "Failed to process image stream: " + streamError.message },
          { status: 500 }
        );
      }
    }
    
    // If we can't handle the output format
    console.error("Unrecognized output format:", output);
    return NextResponse.json(
      { error: "Received an unsupported response type from the image generator" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Ghiblify error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process image" },
      { status: 500 }
    );
  }
}