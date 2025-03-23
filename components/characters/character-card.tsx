import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

export interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
  disabled?: boolean;
}

export function CharacterCard({ character, onClick, disabled }: CharacterCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug character data including image URL type
  useEffect(() => {
    const imageUrlType = character.imageUrl ? 
      (character.imageUrl.includes('cloudinary') ? 'cloudinary' : 
       character.imageUrl.includes('together') ? 'together' :
       character.imageUrl.startsWith('data:') ? 'data-uri' : 
       'other') : 'none';
    
    console.log(`Character ${character.name} data:`, {
      id: character.id,
      name: character.name,
      hasImageUrl: !!character.imageUrl,
      imageUrlType,
      imageUrl: character.imageUrl?.substring(0, 50)
    });
    
    // Set loading state based on image URL availability
    if (character.imageUrl) {
      setIsLoading(false);
    }
  }, [character]);
  
  // Empty image placeholder - will show a colored div when no image is available
  const EmptyImagePlaceholder = () => (
    <div className="w-full h-full bg-gradient-to-b from-blue-800 to-purple-900 flex items-center justify-center">
      <span className="text-white font-bold text-lg">
        {character.name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    </div>
  );
  
  // Validate image URL (supports both direct URLs and Cloudinary URLs)
  const isValidImageUrl = (url?: string): boolean => {
    return !!url && (
      url.startsWith('http://') || 
      url.startsWith('https://') ||
      url.startsWith('/api/avatar') ||
      url.startsWith('data:') // Also accept data URIs for backward compatibility
    );
  };
  
  // Get actual image URL to use
  const imageUrl = isValidImageUrl(character.imageUrl) ? character.imageUrl : null;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-card border border-border rounded-lg p-3 flex flex-col items-center text-center transition-all",
        "hover:border-primary/50 hover:shadow-sm hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        "disabled:opacity-60 disabled:pointer-events-none"
      )}
    >
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3">
        {!imageUrl || imgError ? (
          <EmptyImagePlaceholder />
        ) : (
          <>
            <Image
              src={imageUrl}
              alt={character.name}
              fill
              className="object-cover"
              onError={(e) => {
                console.error(`CharacterCard: Failed to load image for character "${character.name}". URL: ${imageUrl}`, e);
                setImgError(true); // Trigger fallback UI
                setIsLoading(false); // Ensure loading state is updated
              }}
              onLoad={() => setIsLoading(false)} // Update loading state when image loads successfully
              unoptimized={true} // Needed for external URLs like Cloudinary
            />
            {imgError && <EmptyImagePlaceholder />} // Show fallback UI if image fails
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50">
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            )}
          </>
        )}
      </div>
      <h3 className="font-medium text-sm">{character.name}</h3>
      {character.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {character.description}
        </p>
      )}
    </button>
  )
}
