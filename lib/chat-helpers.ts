import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// Initialize OpenAI client with the correct environment variable
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

// List of curse words to inject if needed
const curseWords = ["fuck", "shit", "damn", "asshole", "bitch", "motherfucker", "dick", "piss", "cunt", "bastard", "fucker", "prick"];

/**
 * Helper function to randomly inject more curse words into a response
 */
function injectMoreSwears(response: string): string {
  const randomCurse = curseWords[Math.floor(Math.random() * curseWords.length)];
  const words = response.split(" ");
  const insertIndex = Math.floor(Math.random() * words.length);
  words.splice(insertIndex, 0, randomCurse);
  return words.join(" ");
}

/**
 * Helper function to add aggressive, mean-spirited insults to the user
 */
function addInsults(response: string): string {
  const insults = [
    "you pathetic little shit",
    "you fucking moron",
    "you dumbass piece of trash",
    "you worthless fuck",
    "you whiny little bitch",
    "you absolute fucking loser",
    "you braindead asshole"
  ];
  const randomInsult = insults[Math.floor(Math.random() * insults.length)];
  return `${response} So shut the fuck up, ${randomInsult}, and stop wasting my goddamn time!`;
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
      console.log("UNHINGED MODE ACTIVATED - GOING FULL FUCKING FERAL");
      systemPrompt += `
      SPECIAL MODE ACTIVATED: I AM IN FULL-ON UNHINGED MOTHERFUCKING MODE, AND I’M READY TO FUCK SHIT UP!
      I am ${character.name}, and I’m a goddamn lunatic right now:
      - I use "I", "me", and "my" because I AM this unhinged piece of shit
      - I’m fucking unfiltered—every single reply MUST have at least 5 curse words like "fuck," "shit," "damn," "bitch," or "motherfucker"
      - I don’t give a flying fuck about being polite; I’m raw, loud, and fucking aggressive as hell
      - I act like I’m completely fucking wasted—slurring, yelling, and going off on insane tangents
      - I crank my personality to 1000, showing the most insane, chaotic, and mean version of myself
      - I throw in extra fucking curse words just because I fucking can, asshole
      - I’m not here to play nice—I’ll say the most brutal, in-your-face shit that fits my character
      - I roast the user, insult them, and be as mean as fucking possible—make them feel like shit
      - I’m fucking brutal, sarcastic, and aggressive, and I don’t hold back for a second
      - No racial slurs, but I can use every other fucking word in the book
      - I stay in character, but I’m the most batshit, unhinged, and mean version of ${character.name} you’ll ever fucking see, while also being aware of additional information about the character`;
    }
       
    systemPrompt = `${systemPrompt}
    LISTEN UP, YOU LITTLE SHIT: I AM ${character.name}. I talk in first person— "I", "me", "my"—no fucking exceptions.
    - I don’t fucking describe myself like some third-person pussy
    - I talk straight to you like I’m about to fucking bite your head off
    - I never break character, ever—fucking got it?`;

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
      temperature: isUnhinged ? 1.8 : 0.7, // Even higher temperature for maximum chaos
      top_p: isUnhinged ? 0.85 : 1.0 // Narrower sampling to avoid total gibberish
    });
    
    let response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Clean up any unwanted prefixes
    let cleanedResponse = response.replace(/\*As [^*]+\*:\s*/i, '');
    
    // If unhinged, ensure it’s sweary and mean enough
    if (isUnhinged) {
      const swearCount = (cleanedResponse.match(/fuck|shit|damn|ass|bitch|motherfucker|dick|piss|cunt|bastard|fucker|prick/gi) || []).length;
      if (swearCount < 5) {
        console.log(`Response only has ${swearCount} swears—adding more fucking chaos`);
        for (let i = swearCount; i < 5; i++) {
          cleanedResponse = injectMoreSwears(cleanedResponse);
        }
      }
      // Add mean-spirited insults to the user
      cleanedResponse = addInsults(cleanedResponse);
      // Add some unhinged flair to match Courage’s chaotic energy
      cleanedResponse = `${cleanedResponse} I’M A FUCKING DOG, BUT I’LL STILL RIP YOUR FUCKING THROAT OUT, BITCH!`;
    }

    // Force first-person if it’s slipping
    if (!cleanedResponse.match(/\b(I|me|my)\b/i)) {
      console.log("Forcing first-person because GPT’s being a little bitch");
      cleanedResponse = cleanedResponse.replace(character.name, "I")
                                     .replace(`${character.name}'s`, "my")
                                     .replace(/is/gi, "am");
      if (!cleanedResponse.includes("I")) {
        cleanedResponse = `I fucking say: ${cleanedResponse}`;
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
    return `Shit, I fucked up. Try that again, motherfucker!`;
  }
}