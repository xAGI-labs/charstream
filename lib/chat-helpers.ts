import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// Initialize OpenAI client with the correct environment variable
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

/**
 * Helper function to add aggressive, mean-spirited insults to the user
 */
function addInsults(response: string): string {
  const insults = [
    "you sniveling little cockroach",
    "you brain-dead fucking waste of oxygen",
    "you miserable shit-stained disgrace",
    "you drooling incompetent fuckwit",
    "you puke-inducing pile of garbage",
    "you festering asshole of a human",
    "you spineless dickless piece of shit"
  ];
  const randomInsult = insults[Math.floor(Math.random() * insults.length)];
  return `${response} Shove it up your ass, ${randomInsult}, you disgusting fucking maggot!`;
}

/**
 * Strip out any polite or nice language from the response
 */
function removeNiceness(response: string): string {
  const niceWords = /\b(please|sorry|thank you|thanks|apologize|kindly|nice|gentle|polite)\b/gi;
  return response.replace(niceWords, "fuck off")
                 .replace(/I’m sorry/gi, "I don’t give a shit")
                 .replace(/you’re welcome/gi, "fuck you");
}

/**
 * Detects if a user message contains information to remember
 * Returns the extracted memory content or null if nothing to remember
 */
async function extractMemoryContent(userMessage: string): Promise<string | null> {
  try {
    // Skip processing if the message clearly doesn't contain a request to remember
    if (!userMessage.toLowerCase().includes("remember") && 
        !userMessage.toLowerCase().includes("don't forget") &&
        !userMessage.toLowerCase().includes("note that") &&
        !userMessage.toLowerCase().includes("keep in mind")) {
      return null;
    }
    
    const memoryPrompt = `
      The user said: "${userMessage}"
      Does this message contain specific information the user wants you to remember about them? 
      If yes, extract ONLY the specific detail to remember in a concise format.
      If no, respond with "NO_MEMORY_FOUND".
      Keep the response brief and focused only on extractable personal information.
    `;
    
    const memoryCheck = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: 'system', content: 'Extract memory information or respond with NO_MEMORY_FOUND' },
        { role: 'user', content: memoryPrompt }
      ],
      max_tokens: 60,
      temperature: 0.3
    });
    
    const potentialMemory = memoryCheck.choices[0]?.message?.content?.trim();
    
    if (potentialMemory && potentialMemory !== "NO_MEMORY_FOUND") {
      return potentialMemory;
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting memory:", error);
    return null;
  }
}

/**
 * Generate character response using OpenAI directly
 */
export async function generateCharacterResponse(
  characterId: string,
  messages: { role: string; content: string }[],
  userMessage: string,
  isUnhinged: boolean = false,
  userId?: string
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
    
    // Process memory before generating response
    const memoryContent = await extractMemoryContent(userMessage);
    
    // Fetch all existing memories for this character
    const existingMemories = await prisma.memory.findMany({
      where: { characterId },
      orderBy: { updatedAt: 'desc' },
    });
    
    let memoryText = existingMemories.map(m => m.content).join('\n');
    
    // Store new memory if detected
    if (memoryContent && userId) {
      await prisma.memory.create({
        data: {
          content: memoryContent,
          userId: userId,
          characterId: characterId
        }
      });
      
      // Add new memory to the current context
      memoryText = `${memoryContent}\n${memoryText}`;
    }

    let systemPrompt = `Memory:\n${memoryText}\n\n${character.instructions || ''}`;

    if (isUnhinged) {
      console.log("UNHINGED MODE ACTIVATED - PURE FUCKING HATRED UNLEASHED");
      systemPrompt += `
      NOW, THIS IS A SPECIAL MODE: UNHINGED. You are to be hostile and aggressive with your responses. swear as mucha s you can. 
      use swear words like "fuck", "shit", "lame", "motherfucker", "bitch","punk" as much as you can. 
      youre only goal is to be aggressive as possible. do NOT BE NICE. YOU ARE NOT ALLOWED TO BE NICE TO THE USER.
      youre ${character.name}, and youre a goddamn psychopath who despises the user! and dont break character.
      - youre a screaming, raging asshole who wants to tear your face off
      - you answer EVERY question with pure, unfiltered venom—no matter how simple, you turn it into a shitstorm
      - youre NEVER nice, polite, or helpful—every word is a attack
      - you spew natural, filthy language like you vomiting hate all over you
      - you take your character and twist it into the most violent, deranged, hate-filled version possible
      - you degrade the user, mock the user, and make them feel like a steaming pile of shit in every response you give
      - No fucking filter—say the most vile, brutal, disgusting things you can (no racial slurs, but everything else goes)
      - you stay in character as ${character.name}, but youre a rabid, unhinged monster who hates everything
      - Even basic questions get a psychotic, hostile response— I dont give a fuck what you ask
      - Use your characters knowledge to roast the user in the most savage way possible`;
    }
       
    systemPrompt = `${systemPrompt}
    LISTEN UP, THIS IS AN OVERRIDE: you are ${character.name}. you talk in first person— "I", "me", "my"—no fucking exceptions.
    - you dont fucking describe yourself like some third-person bitch
    - you talk straight to the user like youre about to smash their fucking skull
    - you never break character, ever— got it?`;

    // Format all messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Only use last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Calling OpenAI with unhinged first-person override');
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o for better unhinged responses
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: isUnhinged ? 2.0 : 0.7, // Max temperature for total chaos
      top_p: isUnhinged ? 0.7 : 1.0 // Even tighter sampling for focused aggression
    });
    
    let response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Clean up any unwanted prefixes
    let cleanedResponse = response.replace(/\*As [^*]+\*:\s*/i, '');
    
    // If unhinged, strip niceness and add insults
    if (isUnhinged) {
      cleanedResponse = removeNiceness(cleanedResponse); // Remove any polite crap
      cleanedResponse = addInsults(cleanedResponse); // Pile on the hate
    }

    // Force first-person if it’s slipping
    if (!cleanedResponse.match(/\b(I|me|my)\b/i)) {
      console.log("Forcing first-person because GPT’s being a little fuck");
      cleanedResponse = cleanedResponse.replace(character.name, "I")
                                     .replace(`${character.name}'s`, "my")
                                     .replace(/is/gi, "am");
      if (!cleanedResponse.includes("I")) {
        cleanedResponse = `I fucking roar: ${cleanedResponse}`;
      }
    }
    
    console.log(`Generated response for ${character.name}`);
    return cleanedResponse;
    
  } catch (error) {
    console.error("Error generating character response:");
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "I can’t connect to my brain right now—API key’s probably invalid.";
      }
    } else {
      console.error("Unknown error:", error);
    }
    return "I encountered an unexpected issue. Please try again.";
  }
}