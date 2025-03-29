"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  AlertCircle, 
  Download,
  Upload, 
  ImageIcon, 
  Loader2 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GhiblifyPage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultImgRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous results when uploading new image
    setResultImage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSourceImage(event.target.result as string);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded file. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sourceImage) {
      setError("Please upload an image first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResultImage(null);

      const response = await fetch("/api/ghiblify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: sourceImage,
          prompt: prompt || undefined,
        }),
      });

      const data = await response.json();
      console.log("API response received:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      // Check if we received a valid result
      if (!data.result) {
        throw new Error("No result received from server");
      }
      
      console.log("Setting result image from API response");
      setResultImage(data.result);
      
    } catch (err: any) {
      console.error("Error processing image:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = async () => {
    try {
      // Try to get the image from the img element first
      if (resultImgRef.current?.src) {
        const a = document.createElement('a');
        a.href = resultImgRef.current.src;
        a.download = `ghiblified-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      
      // Fallback to fetching from resultImage state
      if (!resultImage) {
        setError("No image to download");
        return;
      }
      
      // Try to fetch the image URL
      const response = await fetch(resultImage);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ghiblified-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Download error:", err);
      setError(`Failed to download image: ${err.message}`);
    }
  };

  const resetForm = () => {
    setSourceImage(null);
    setResultImage(null);
    setPrompt("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Ghiblify Your Images</h1>
        <p className="text-muted-foreground">
          Transform your photos into beautiful Studio Ghibli style artwork
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload an image</CardTitle>
            <CardDescription>
              Select a photo you want to transform into Ghibli style art
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <div className="flex items-center gap-4">
                  <div className="relative border rounded-lg overflow-hidden w-full h-[200px] flex items-center justify-center bg-muted">
                    {sourceImage ? (
                      <Image
                        src={sourceImage}
                        alt="Source image"
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                        <Input
                          id="image-upload"
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                          disabled={isLoading}
                        />
                      </Label>
                      {sourceImage && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={resetForm}
                          disabled={isLoading}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Custom Style Prompt (Optional)</Label>
                <Textarea
                  id="prompt"
                  placeholder="Studio Ghibli style portrait, detailed, beautiful lighting"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-y"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for default Ghibli style or customize to your preference
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="ml-auto" 
              disabled={!sourceImage || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Ghiblify"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Transforming your image into Ghibli style...
            <br />
            <span className="text-sm">
              This may take up to a minute. Please be patient.
            </span>
          </p>
        </div>
      )}

      {resultImage && (
        <Card>
          <CardHeader>
            <CardTitle>Your Ghiblified Image</CardTitle>
            <CardDescription>
              Here's your image in beautiful Studio Ghibli style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                {/* Using regular img tag instead of Next.js Image component */}
                <img
                  ref={resultImgRef}
                  src={resultImage}
                  alt="Ghiblified result"
                  className="object-contain max-h-full max-w-full"
                  onError={(e) => {
                    console.error("Image failed to load:", resultImage);
                    setError("Failed to load the generated image");
                    // Clear the broken src to prevent further errors
                    e.currentTarget.src = "";
                  }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Click the download button to save your image
            </p>
            <Button
              variant="default"
              onClick={downloadImage}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Image
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground pt-8">
        Powered by Replicate AI • Studio Ghibli style transformation
      </div>
    </div>
  );
}