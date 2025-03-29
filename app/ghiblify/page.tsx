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
  Loader2,
  Wand2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GhiblifyPage() {
  const [selectedStyle, setSelectedStyle] = useState("TOK");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultImgRef = useRef<HTMLImageElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStyle(e.target.value);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      } else {
        setError("Please drop an image file.");
      }
    }
  };

  const processImageFile = (file: File) => {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
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
          prompt: `${selectedStyle} style ${prompt || "illustration"}`,
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 py-6">
      <div className="container px-4 sm:px-6 mx-auto max-w-3xl">
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Ghiblify Your Images</h1>
          <p className="text-muted-foreground text-base md:text-lg mx-auto">
            Transform your photos into beautiful Studio Ghibli style artwork with our AI-powered image generator
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="animate-in fade-in mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-lg border-border/40">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Upload className="h-5 w-5 text-primary" />
                Upload an image
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Select a photo you want to transform into Ghibli style art
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label htmlFor="image" className="text-base font-medium">Image</Label>
                <div 
                  ref={dropZoneRef}
                  className={`relative border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary'} transition-colors rounded-lg overflow-hidden w-full h-[200px] md:h-[280px] flex items-center justify-center bg-muted/20 cursor-pointer mt-2`}
                  onClick={handleClickUpload}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {sourceImage ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={sourceImage}
                        alt="Source image"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto" />
                      <p className="text-sm md:text-base text-muted-foreground">Drag and drop or click to upload</p>
                    </div>
                  )}
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="style" className="text-base font-medium">Select Ghibli Style</Label>
                <select
                  id="style"
                  value={selectedStyle}
                  onChange={handleStyleChange}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  disabled={isLoading}
                >
                  <option value="TOK">TOK (Default)</option>
                  <option value="Spirited Away">Spirited Away</option>
                  <option value="My Neighbor Totoro">My Neighbor Totoro</option>
                  <option value="Princess Mononoke">Princess Mononoke</option>
                  <option value="Howl's Moving Castle">Howl's Moving Castle</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t py-4">
              <Button 
                type="submit" 
                className="ml-auto" 
                disabled={!sourceImage || isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Ghiblify Image
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse"></div>
              <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary relative z-10" />
            </div>
            <div className="text-center">
              <p className="text-base md:text-lg font-medium">
                Transforming your image into Ghibli style...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This may take up to a minute. Please be patient.
              </p>
            </div>
          </div>
        )}

        {resultImage && (
          <div className="mt-8 animate-in slide-in-from-bottom-4">
            <Card className="shadow-xl border-border/40">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Your Ghiblified Image
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Here's your image transformed into beautiful Studio Ghibli style
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gradient-to-b from-background/50 to-muted/20 p-4 md:p-6">
                  <div className="w-full rounded-lg shadow-lg overflow-hidden">
                    <img
                      ref={resultImgRef}
                      src={resultImage}
                      alt="Ghiblified result"
                      className="w-full h-auto object-contain max-w-full"
                      onError={(e) => {
                        console.error("Image failed to load:", resultImage);
                        setError("Failed to load the generated image");
                        e.currentTarget.src = "";
                      }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row items-center justify-between bg-muted/30 border-t py-4 gap-4">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Click the download button to save your image
                </p>
                <Button
                  variant="default"
                  onClick={downloadImage}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground py-8">
          <p className="flex items-center justify-center gap-1 flex-wrap">
            <span>Powered by</span>
            <span className="font-semibold text-primary">Replicate AI</span>
            <span className="mx-1">•</span>
            <span>Studio Ghibli style transformation</span>
          </p>
        </div>
      </div>
    </div>
  );
}