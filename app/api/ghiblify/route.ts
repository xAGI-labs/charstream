import { NextResponse } from 'next/server';
import Replicate from 'replicate';

async function uploadImageToCloudinary(base64Image: string) {
  try {
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

export async function POST(req: Request) {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const body = await req.json();
    const { imageBase64, prompt } = body;
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const enhancedPrompt = prompt || "recreate this image in the style of ghibli";
    
    console.log("Starting Ghiblify process with prompt:", enhancedPrompt);
    
    const imageUrl = await uploadImageToCloudinary(imageBase64);
    console.log("Image uploaded to:", imageUrl);
    
    const output = await replicate.run(
      "colinmcdonnell22/ghiblify:b4014c6ade5c1ac4c0d90ee5ea26ee9cf56ad28ee8a705737a0be6cdfdc3ac2a",
      {
        input: {
          image: imageUrl,
          model: "dev",
          prompt: "recreate this image in the style of ghibli",
          go_fast: false,
          lora_scale: 0.95,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "jpg",
          guidance_scale: 3.5,
          output_quality: 100,
          prompt_strength: 0.65,
          extra_lora_scale: 1,
          num_inference_steps: 32
        }
      }
    );
    
    console.log("Replicate API output:", typeof output, Array.isArray(output) ? output.length : "not an array");
    
    if (output && Array.isArray(output) && output.length > 0) {
      const streamResponse = output[0];
      console.log("Output type:", typeof streamResponse, streamResponse ? streamResponse.constructor.name : "null");
      
      try {
        if (streamResponse && typeof streamResponse === 'object' && 'then' in streamResponse) {
          const resolvedResponse = await streamResponse;
          console.log("Resolved response type:", typeof resolvedResponse);
          return NextResponse.json({ 
            success: true,
            result: resolvedResponse 
          });
        } else if (streamResponse && typeof streamResponse === 'object' && streamResponse instanceof ReadableStream) {
          console.log("Handling ReadableStream response");
          return NextResponse.json({ 
            success: true,
            result: streamResponse.toString(),
            isStream: true
          });
        } else {
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