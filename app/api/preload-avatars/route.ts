import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAvatar, resetRateLimitTracking } from '@/lib/avatar';

// Set runtime to nodejs for API key access
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // Get characters from request
    const { characters, strategy = 'sequential' } = await req.json();
    
    // Start preloading in background, don't await the whole process
    if (Array.isArray(characters)) {
      // Reset rate limit tracking before starting a fresh batch
      resetRateLimitTracking();
      
      // Start the preload process without waiting for completion
      (async () => {
        console.log(`Starting avatar preloading for ${characters.length} characters with strategy: ${strategy}`);
        
        // Track successes and failures
        const results = {
          success: 0,
          failures: 0,
        };
        
        if (strategy === 'batch') {
          // Batch strategy - load up to 3 at a time with staggered starts
          const batchSize = 3;
          for (let i = 0; i < characters.length; i += batchSize) {
            const batch = characters.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (character, index) => {
              // Stagger starts within the batch to avoid hammering API
              await new Promise(r => setTimeout(r, index * 800));
              
              try {
                console.log(`Preloading avatar for ${character.name}...`);
                const avatarUrl = await generateAvatar(character.name, character.description);
                
                if (avatarUrl) {
                  console.log(`✅ Generated avatar for ${character.name}: ${avatarUrl}`);
                  results.success++;
                } else {
                  console.log(`❌ Failed to generate avatar for ${character.name}`);
                  results.failures++;
                }
              } catch (error: any) {
                console.error(`Error generating avatar for ${character.name}:`, error);
                results.failures++;
              }
            }));
            
            // Wait between batches
            if (i + batchSize < characters.length) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
        } else {
          // Sequential strategy - process characters one by one with delay between each
          for (const character of characters) {
            try {
              console.log(`Preloading avatar for ${character.name}...`);
              const avatarUrl = await generateAvatar(character.name, character.description);
              
              if (avatarUrl) {
                console.log(`✅ Generated avatar for ${character.name}: ${avatarUrl}`);
                results.success++;
              } else {
                console.log(`❌ Failed to generate avatar for ${character.name}`);
                results.failures++;
              }
            } catch (error: any) {
              console.error(`Error generating avatar for ${character.name}:`, error);
              results.failures++;
            }
            
            // Wait a bit to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1800));
          }
        }
        
        console.log('Avatar preloading complete', results);
      })();
    }
    
    // Return immediately without waiting for all avatars
    return NextResponse.json({ 
      message: 'Avatar preloading initiated',
      strategy,
      count: characters?.length || 0
    });
  } catch (error: any) {
    console.error('Error in preload-avatars route:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
