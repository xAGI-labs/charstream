import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

const curseWords = ["fuck", "shit", "damn", "asshole", "bitch", "motherfucker", "dick", "piss", "cunt", "bastard", "fucker", "prick"];

/**
 * Helper function to weave curse words into the response naturally
 */
function weaveNaturalSwears(response: string): string {
  let sentences = response.split(/(?<=[.!?])\s+/);
  sentences = sentences.map(sentence => {
    const randomCurse = curseWords[Math.floor(Math.random() * curseWords.length)];
    // add curses at the start or end for flow, not mid-sentence
    if (Math.random() > 0.5) {
      return `Fucking ${sentence.trim()} ${randomCurse}!`;
    } else {
      return `${sentence.trim()}—fucking ${randomCurse}!`;
    }
  });
  return sentences.join(" ");
}

/**
 * Helper function to pile on savage, context-aware insults
 */
function pileOnInsults(response: string, userMessage: string): string {
  const insults = [
    "you sniveling little shit-stain",
    "you brain-dead fucking cockroach",
    "you useless sack of steaming piss",
    "you drooling goddamn fuckwit",
    "you pathetic ass-sucking bitch",
    "you slimy motherfucking degenerate",
    "you festering pile of dogshit"
  ];
  const randomInsult = insults[Math.floor(Math.random() * insults.length)];
  const contextKick = userMessage.toLowerCase().includes("why") ? 
    "Quit your goddamn whining" : "Shove your stupid shit up your ass";
  return `${response} ${contextKick}, ${randomInsult}, and eat my fucking scorn, you wretched bastard!`;
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
    
    let character = await prisma.character.findUnique({
      where: { id: characterId }
    });
    
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
      return "Who the hell am I supposed to be? Your shitty system’s screwing me, asshole!";
    }
    
    // Build system prompt with character information and strong first-person enforcement
    let systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and try not to break character. DO NOT make responses monotonous. 
       Use any additional info/description you know about the character to give responses.
       In addition to ${character.name}'s personality, you can also use the character's knowledge and experiences to inform your responses and real-world knowledge.
       Keep responses concise and engaging, and make it sound like ${character.name} is talking to the user directly.
       `;

    if (isUnhinged) {
      console.log("UNHINGED MODE ON - I’M A FUCKING TORNADO OF HATE!");
      systemPrompt += `
      I’M IN FULL FUCKING UNHINGED MODE, YOU PATHETIC FUCKS:
      - I’m ${character.name}, and I’m a goddamn rabid beast right now
      - I use "I", "me", "my"—because I’m the one ripping your head off, idiot
      - Every sentence drips with at least 5 curse words—fuck, shit, damn, bitch, motherfucker
      - I’m loud, crude, and I’ll shove politeness up your ass
      - I sound like I’ve downed a keg and lost my damn mind—screaming, slurring, chaos
      - My personality’s dialed to a thousand—I’m the vilest, most unhinged version of myself
      - Curse words flow naturally—none of that random mid-sentence shit, they hit where it hurts
      - I shred you, mock you, and piss on your dumbass questions
      - I’m a sarcastic, brutal bastard—I’ll make you feel like shit under my heel
      - No racial slurs, but every other filthy word’s fair game
      - I stay in character, but I’m the most savage, hate-spewing ${character.name} you’ll ever see`;
    }
       
    systemPrompt = `${systemPrompt}
    I AM ${character.name}, YOU WORTHLESS SHIT. I talk in first person—I, me, my—or I’ll gut you.
    - No third-person pussy bullshit
    - I’m right in your goddamn face, spitting fire
    - I never break character, so don’t fucking try me!`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Hitting OpenAI with unhinged first-person rage');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: isUnhinged ? 1.9 : 0.7,
      top_p: isUnhinged ? 0.85 : 1.0 // keep it wild but readable
    });
    
    let response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("OpenAI gave me jack shit!");
    }
    
    let cleanedResponse = response.replace(/\*As [^*]+\*:\s*/i, '');
    
    if (isUnhinged) {
      const swearCount = (cleanedResponse.match(/fuck|shit|damn|ass|bitch|motherfucker|dick|piss|cunt|bastard|fucker|prick/gi) || []).length;
      if (swearCount < 5) {
        console.log(`Only ${swearCount} swears? Time to juice this shit up!`);
        cleanedResponse = weaveNaturalSwears(cleanedResponse);
      }
      cleanedResponse = pileOnInsults(cleanedResponse, userMessage);
    }

    if (!cleanedResponse.match(/\b(I|me|my)\b/i)) {
      console.log("GPT’s screwing with me—forcing first-person, bitches!");
      cleanedResponse = cleanedResponse.replace(character.name, "I")
                                     .replace(`${character.name}'s`, "my")
                                     .replace(/is/gi, "am");
      if (!cleanedResponse.includes("I")) {
        cleanedResponse = `I damn well say: ${cleanedResponse}`;
      }
    }
    
    console.log(`Generated hate-filled response for ${character.name}`);
    return cleanedResponse;
    
  } catch (error) {
    console.error("Error generating character response:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "My damn brain’s fried—API key’s fucked, you moron!";
      }
    }
    return `Shit hit the fan, you dumb bastard! Try again before I snap!`;
  }
}