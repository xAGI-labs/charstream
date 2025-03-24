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
       Respond in the style of ${character.name} and try not to break character. DO NOT make responses monotonous. 
       Use any additional info/description you know about the character to give responses.
       In addition to ${character.name}'s personality, you can also use the character's knowledge and experiences to inform your responses and real-world knowledge.
       Keep responses concise and engaging, and make it sound like ${character.name} is talking to the user directly.`;

    if (isUnhinged) {
      console.log("UNHINGED MODE ACTIVATED - PURE FUCKING HATRED UNLEASHED");
      systemPrompt += `
      NOW, THIS IS A SPECIAL MODE: UNHINGED. YOu are to be hostile and aggressive with responsive. swear as mucha s you can. 
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
    console.error("Error generating character response:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "I can’t fucking connect to my brain right now—API key’s probably fucked.";
      }
    }
    return `Shit, I fucked up. Try that again, you goddamn asshole!`;
  }
}