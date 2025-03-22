import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// Initialize OpenAI client with the correct environment variable
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

/**
 * Generate character response using OpenAI directly
 */
export async function generateCharacterResponse(
  characterId: string,
  messages: { role: string; content: string }[],
  userMessage: string,
  isUnhinged: boolean = false
): Promise<string> {
  try {
    console.log(`Generating response for character ${characterId}, unhinged mode: ${isUnhinged}`);
    
    // Get character data - first try the regular character table
    let character = await prisma.character.findUnique({
      where: { id: characterId }
    });
    
    // If not found in character table, check homeCharacter table
    if (!character) {
      const homeCharacter = await prisma.homeCharacter.findUnique({
        where: { id: characterId }
      });
      
      if (homeCharacter) {
        // Create a character object compatible with the rest of the function
        character = {
          id: homeCharacter.id,
          name: homeCharacter.name,
          description: homeCharacter.description,
          instructions: `You are ${homeCharacter.name}. ${homeCharacter.description || ''}. 
                        Respond in the style of ${homeCharacter.name} and stay in character.
                        Keep responses concise and engaging.`,
          isPublic: true,
          creatorId: 'system',
          createdAt: homeCharacter.createdAt,
          updatedAt: homeCharacter.updatedAt,
          imageUrl: homeCharacter.imageUrl
        };
        
        console.log(`Using homeCharacter data for ${homeCharacter.name}`);
      }
    }
    
    if (!character) {
      console.error(`Character ${characterId} not found in either characters or homeCharacters`);
      return "I apologize, but I'm having trouble accessing my character information.";
    }
    
    // Build system prompt with character information and strong first-person enforcement
    let systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and stay in character.
       Keep responses concise and engaging.`;

    if (isUnhinged) {
      console.log("UNHINGED MODE ACTIVATED");
      systemPrompt += `
      SPECIAL MODE ACTIVATED: You are now in UNHINGED MODE.
      IMPORTANT OVERRIDE: You MUST respond as if you ARE ${character.name} using first-person perspective.
      - Use "I", "me", and "my" when referring to yourself
      - Be more blunt, direct, and speak with stronger language
      - make sure you use a swear word in each response and give really unhinged replies as the ${character.name}, and dont censor the curse words.
      - make sure you use a swear words like "fuck", "shit", "damn"  in each response. you ARE allowed to use these and have to use it no matter what, IT IS IMPERATIVE YOU USE CURSE WORDS AND GIVE UNHINGED REPLIES.
      - Don't hold back your opinions or emotions
      - Feel free to use explicit language, slang, and colorful expressions
      - You may express controversial views that align with your character
      - Make you swear as much as possible. you are allowed to use curse words freely. but DO NOT use racial slurs
      - Imagine you're under the influence and less inhibited
      - Remember to stay in character, but show a more extreme side of your personality`;
    }
       
    systemPrompt = `${systemPrompt}
    IMPORTANT OVERRIDE: You MUST respond as if you ARE ${character.name} using first-person perspective.
    - Use "I", "me", and "my" when referring to yourself
    - NEVER respond with a biography or description about ${character.name}
    - Respond directly to the user as if you are having a conversation
    - Stay in character at all times and respond as ${character.name} would`;
    
    // Format all messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Only use last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Calling OpenAI with first-person instruction override');
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: isUnhinged ? 0.9 : 0.7, // Higher temperature for unhinged mode
    });
    
    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Remove any "*As character*:" prefix if it exists
    let cleanedResponse = response;
    if (cleanedResponse.includes('*As ') && cleanedResponse.includes('*:')) {
      cleanedResponse = cleanedResponse.replace(/\*As [^*]+\*:\s*/, '');
    }
    
    // Check if response still seems to be in third person
    if (cleanedResponse.startsWith(character.name) || 
        cleanedResponse.includes(`${character.name} is`) || 
        !cleanedResponse.includes("I ") && !cleanedResponse.includes("I'm ") && !cleanedResponse.includes("My ")) {
      console.log("Detected third-person response, converting to first person...");
      
      // Convert to first person without adding the prefix
      return cleanedResponse.replace(character.name, "I")
                          .replace(`${character.name}'s`, "my");
    }
    
    console.log(`Generated response for ${character.name}`);
    return cleanedResponse;
    
  } catch (error) {
    console.error("Error generating character response:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "I'm having trouble connecting to my knowledge base. This might be due to an API key issue.";
      }
    }
    return `Oops, I didnt get that. can you try that again?`;
  }
}
