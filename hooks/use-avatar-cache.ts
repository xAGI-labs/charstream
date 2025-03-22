import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

// Cache URLs in memory to avoid repeated fetching
const urlCache: Record<string, string> = {};

/**
 * Hook to provide consistent avatar URL generation with caching
 */
export function useAvatarCache() {
  const { isSignedIn, isLoaded } = useAuth();
  const [initialized, setInitialized] = useState(false);
  
  // Make sure hook is properly initialized after auth loads
  useEffect(() => {
    if (isLoaded) {
      console.log('Avatar cache hook initialized, auth state:', { isSignedIn });
      setInitialized(true);
    }
  }, [isLoaded, isSignedIn]);

  // Generate consistent avatar URLs
  const getAvatarUrl = useCallback((name: string, size: number = 200) => {
    if (!name) {
      console.warn("Invalid name provided to getAvatarUrl");
      // Provide a default name for robustness
      name = "unknown";
    }
    
    // Create a cache key for this name and size
    const cacheKey = `avatar-${name}-${size}`;
    
    // Return from cache if available
    if (urlCache[cacheKey]) {
      return urlCache[cacheKey];
    }
    
    // Add timestamp param to avoid browser cache issues
    const timestamp = new Date().getTime();
    
    // Generate URL using our avatar API endpoint which handles caching AND checks the database
    const url = `/api/avatar?name=${encodeURIComponent(name)}&width=${size}&height=${size}&checkDb=true&t=${timestamp}`;
    
    // Cache the URL for future use
    urlCache[cacheKey] = url;
    
    return url;
  }, []);

  // Also provide a method to check if auth is ready
  const isAuthReady = useCallback(() => {
    return isLoaded;
  }, [isLoaded]);

  return {
    getAvatarUrl,
    isAuthReady,
    isAuthenticated: isLoaded && isSignedIn,
    initialized
  };
}
