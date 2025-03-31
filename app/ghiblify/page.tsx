"use client";

import { useState, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Wand2,
  RefreshCw
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CharacterFooter from "@/components/FooterBar";

export default function GhiblifyPage() {
  const [selectedStyle, setSelectedStyle] = useState("TOK");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [currentImageHash, setCurrentImageHash] = useState<string | null>(null);
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

  const calculateImageHash = async (imageData: string): Promise<string> => {
    const data = imageData.split(',')[1]; // Remove the data URL prefix
    const msgUint8 = new TextEncoder().encode(data.substring(0, 1000)); // Use first 1000 chars for performance
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const processImageFile = (file: File) => {
    setResultImage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const imageData = event.target.result as string;
        const imageHash = await calculateImageHash(imageData);
        
        if (imageHash === currentImageHash) {
          setError("This appears to be the same image you already uploaded. Try a different image for better results.");
          return;
        }
        
        setCurrentImageHash(imageHash);
        setSourceImage(imageData);
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
          prompt: "recreate this image in the style of ghibli",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      if (!data.result) {
        throw new Error("No result received from server");
      }
      
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
      if (resultImgRef.current?.src) {
        const a = document.createElement('a');
        a.href = resultImgRef.current.src;
        a.download = `ghiblified-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      
      if (!resultImage) {
        setError("No image to download");
        return;
      }
      
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
    setCurrentImageHash(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* SEO Metadata */}
      <Head>
        <title>Ghiblify Your Images - Create Ghibli Avatars on Charstream.xyz</title>
        <meta
          name="description"
          content="Transform your photos into Studio Ghibli-style avatars with Charstream.xyz's Ghibli image generator. Create enchanting Ghibli avatars using AI, inspired by OpenAI technology."
        />
        <meta
          name="keywords"
          content="ghibli avatars, ghiblify, ghibli image generator, openAI ghibli, studio ghibli art, AI image transformation, charstream.xyz"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Charstream.xyz" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph Tags */}
        <meta property="og:title" content="Ghiblify Your Images - Create Ghibli Avatars on Charstream.xyz" />
        <meta
          property="og:description"
          content="Transform your photos into Studio Ghibli-style avatars with Charstream.xyz's Ghibli image generator. Create enchanting Ghibli avatars using AI."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://charstream.xyz/ghiblify" />
        <meta property="og:image" content="https://charstream.xyz/og-image.jpg" /> {/* Replace with actual image URL */}
        <meta property="og:site_name" content="Charstream.xyz" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ghiblify Your Images - Create Ghibli Avatars on Charstream.xyz" />
        <meta
          name="twitter:description"
          content="Transform your photos into Studio Ghibli-style avatars with Charstream.xyz's Ghibli image generator."
        />
        <meta name="twitter:image" content="https://charstream.xyz/og-image.jpg" /> {/* Replace with actual image URL */}

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Ghiblify - Ghibli Image Generator",
            "url": "https://charstream.xyz/ghiblify",
            "description": "Transform your photos into Studio Ghibli-style avatars with Charstream.xyz's Ghibli image generator.",
            "applicationCategory": "Image Editing",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "creator": {
              "@type": "Organization",
              "name": "Charstream.xyz",
              "url": "https://charstream.xyz"
            }
          })}
        </script>
      </Head>

      {/* Page Content */}
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl pl-16 md:pl-20">
          {/* Header */}
          <header className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-primary/70">
                Ghiblify
              </span>{" "}
              Your Images with Charstream.xyz
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transform your photos into enchanting Studio Ghibli-style avatars using our AI-powered Ghibli image generator.
            </p>
          </header>

          {/* Introductory Section for SEO */}
          <section className="mb-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Create Ghibli Avatars with Charstream.xyz</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Looking to ghiblify your images? Charstream.xyz offers a free Ghibli image generator to turn your photos into stunning Studio Ghibli-style artwork. Whether you're creating ghibli avatars or exploring AI-powered art inspired by OpenAI technology, our tool makes it easy and fun. Upload your image, choose a style, and watch the magic happen!
            </p>
          </section>

          {/* Main Content */}
          <main>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Input Section */}
              <Card className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Create Your Ghibli Avatar
                  </CardTitle>
                  <CardDescription>
                    Upload an image and customize your Studio Ghibli transformation
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <CardContent className="flex-1 space-y-6 pt-6">
                    {/* Drop Zone */}
                    <div 
                      ref={dropZoneRef}
                      className={`
                        relative border-2 border-dashed rounded-xl p-4
                        ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'}
                        ${sourceImage ? 'hover:border-primary/50' : 'hover:border-primary/30'}
                        transition-all duration-200
                      `}
                      onClick={handleClickUpload}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      role="button"
                      aria-label="Upload or drop an image to ghiblify"
                    >
                      {sourceImage ? (
                        <div className="relative w-full h-64">
                          <Image
                            src={sourceImage}
                            alt="Preview of your uploaded image for Ghibli transformation"
                            fill
                            className="object-contain rounded-md"
                            priority
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Button variant="secondary" size="sm">
                              Change Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 space-y-4">
                          <ImageIcon className="mx-auto h-12 w-12 text-primary/70" />
                          <div>
                            <p className="font-medium">Drop an image here</p>
                            <p className="text-sm text-muted-foreground">or click to browse (max 10MB)</p>
                          </div>
                        </div>
                      )}
                      <Input
                        id="image-upload"
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isLoading}
                        aria-label="Upload image file for Ghibli transformation"
                      />
                    </div>

                    {/* Style Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="style" className="text-sm font-medium">Ghibli Art Style</Label>
                      <select
                        id="style"
                        value={selectedStyle}
                        onChange={handleStyleChange}
                        disabled={isLoading}
                        className="
                          w-full p-2.5 rounded-md border bg-background
                          focus:ring-2 focus:ring-primary/50 focus:border-primary
                          disabled:opacity-50 transition-all duration-200
                        "
                        aria-label="Select Studio Ghibli art style"
                      >
                        <option value="TOK">Default (TOK)</option>
                        <option value="Spirited Away">Spirited Away</option>
                        <option value="My Neighbor Totoro">My Neighbor Totoro</option>
                        <option value="Princess Mononoke">Princess Mononoke</option>
                        <option value="Howl's Moving Castle">Howl's Moving Castle</option>
                      </select>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                      <Label htmlFor="prompt" className="text-sm font-medium">Enhance with Prompt</Label>
                      <Input
                        id="prompt"
                        placeholder="e.g., 'sunset scene, lush forest'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        className="bg-background transition-all duration-200"
                        aria-label="Add a custom prompt to enhance your Ghibli transformation"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/50 pt-4 flex gap-3">
                    {sourceImage && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isLoading}
                        className="flex-1"
                        aria-label="Reset the form and upload a new image"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={!sourceImage || isLoading}
                      className="flex-1"
                      aria-label="Transform your image into a Studio Ghibli-style avatar"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Transforming...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Ghiblify
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Output Section */}
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Your Ghibli Transformation
                  </CardTitle>
                  <CardDescription>
                    See your image transformed into a Studio Ghibli-style avatar
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-96 space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                        <Loader2 className="h-12 w-12 text-primary animate-spin relative" />
                      </div>
                      <p className="text-muted-foreground text-sm">Creating your Ghibli masterpiece...</p>
                    </div>
                  ) : resultImage ? (
                    <div className="relative">
                      <img
                        ref={resultImgRef}
                        src={resultImage}
                        alt="Your transformed Studio Ghibli-style avatar artwork"
                        className="w-full h-auto rounded-md max-h-[450px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 text-muted-foreground space-y-4">
                      <Wand2 className="h-12 w-12 text-primary/50" />
                      <p className="text-sm text-center max-w-xs">
                        Your transformed Ghibli avatar will appear here after processing
                      </p>
                    </div>
                  )}
                </CardContent>

                {resultImage && (
                  <CardFooter className="bg-muted/50 pt-4">
                    <Button
                      onClick={downloadImage}
                      className="w-full"
                      aria-label="Download your Studio Ghibli-style avatar artwork"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Artwork
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </main>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-muted-foreground py-6 border-t border-muted/20">
            <p>
              Powered by{" "}
              <span className="font-medium text-primary">Replicate AI</span>{" "}
              • Inspired by Studio Ghibli •{" "}
              <Link href="/" className="text-primary hover:underline">
                Back to Charstream.xyz
              </Link>
            </p>
          </footer>
        </div>
        <CharacterFooter />
      </div>
    </>
  );
}