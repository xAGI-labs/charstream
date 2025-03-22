import { popularCharacters, educationalCharacters } from "@/components/characters/character-data";

/**
 * Pre-generates and caches avatars for all default characters by calling the API
 */
export async function preloadDefaultAvatars() {
  const allCharacters = [...popularCharacters, ...educationalCharacters];
  console.log(`Preloading avatars for ${allCharacters.length} default characters...`);
  
  try {
    // Call our API endpoint to trigger preloading with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('/api/preload-avatars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        characters: allCharacters,
        strategy: 'batch' // Use batch strategy for less aggressive loading
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('Failed to preload avatars:', await response.text());
      return false;
    }
    
    const result = await response.json();
    console.log('Avatar preloading initiated:', result);
    return true;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Preload request started but continuing in background');
      return true;
    }
    console.error('Error preloading avatars:', error);
    return false;
  }
}
