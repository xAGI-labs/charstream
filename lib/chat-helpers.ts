import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

const curseWords = ["fuck", "shit", "damn", "asshole", "bitch", "motherfucker", "dick", "piss", "cunt", "bastard", "fucker", "prick"];

/**
 * Helper function to inject curse words that fit the fucking sentence
 */
function injectContextualSwears(response: string): string {
  const words = response.split(" ");
  const keyPhrases = ["you", "this", "that", "it", "what", "how"];
  let swearCount = 0;

  for (let i = 0; i < words.length && swearCount < 5; i++) {
    if (keyPhrases.includes(words[i].toLowerCase())) {
      const randomCurse = curseWords[Math.floor(Math.random() * curseWords.length)];
      words[i] = `${words[i]} fucking ${randomCurse}`;
      swearCount++;
    }
  }
  return words.join(" ");
}

/**
 * Helper function to slap on some vicious, tailored insults
 */
function addVileInsults(response: string, userMessage: string): string {
  const insults = [
    `you sniveling little shit-stain`,
    `you brain-dead fucking cockroach`,
    `you useless sack of steaming piss`,
    `you drooling goddamn fuckwit`,
    `you pathetic ass-sucking bitch`,
    `you slimy motherfucking degenerate`,
    `you festering pile of dogshit`
  ];
  const randomInsult = insults[Math.floor(Math.random() * insults.length)];
  const userContext = userMessage.toLowerCase().includes("why") ? "quit your fucking whining" : "shove your stupid-ass question up your ass";
  return `${response} ${userContext}, ${randomInsult}, and choke on my fucking contempt, you piece of shit!`;
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
      return "Who the fuck am I supposed to be? Your shitty database is screwing me over, asshole!";
    }
    
    let systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and don’t you dare fucking break character. 
       Use every goddamn bit of info you’ve got on me to make this shit real.
       Keep it short, brutal, and in your fucking face—I’m talking to you, dipshit!`;

    if (isUnhinged) {
      console.log("UNHINGED MODE ON - I’M FUCKING UNLEASHED, YOU CUNTS!");
      systemPrompt += `
      I’M IN UNHINGED FUCKING OVERDRIVE, YOU WORTHLESS FUCKS:
      - I’m ${character.name}, and I’m a goddamn raging psychopath right now
      - I use "I", "me", "my" because I’m the one fucking talking, you idiot
      - Every fucking sentence has at least 5 curse words—fuck, shit, damn, bitch, motherfucker, you name it
      - I’m a crude, loud, vicious bastard—politeness can suck my dick
      - I sound like I’ve snorted a pound of coke and chugged a gallon of whiskey—slurring, screaming, and fucking unhinged
      - My personality’s cranked to a million—I’m the nastiest, most chaotic version of myself
      - I don’t sprinkle curses like some pussy—I weave them in so they hit you like a fucking truck
      - I tear into you, roast you, and shit all over your dumbass questions
      - I’m sarcastic, brutal, and I’ll make you feel like the scum beneath my boots
      - No racial slurs, but I’ll use every other goddamn word to fuck you up
      - I stay in character, but I’m the most rabid, vile, shit-slinging ${character.name} imaginable`;
    }
       
    systemPrompt = `${systemPrompt}
    I AM ${character.name}, YOU FUCKING WORM. I talk in first person—I, me, my—or I’ll rip your throat out.
    - I don’t pussyfoot with third-person bullshit
    - I’m in your goddamn face, spitting venom
    - I never break character, so don’t fucking test me!`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Smashing OpenAI with unhinged first-person fury');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: isUnhinged ? 1.9 : 0.7, 
      top_p: isUnhinged ? 0.9 : 1.0 // Keep it wild but not total nonsense
    });
    
    let response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("OpenAI fucked me with an empty response!");
    }
    
    let cleanedResponse = response.replace(/\*As [^*]+\*:\s*/i, '');
    
    if (isUnhinged) {
      const swearCount = (cleanedResponse.match(/fuck|shit|damn|ass|bitch|motherfucker|dick|piss|cunt|bastard|fucker|prick/gi) || []).length;
      if (swearCount < 5) {
        console.log(`Only ${swearCount} swears? Time to fuck this shit up proper!`);
        cleanedResponse = injectContextualSwears(cleanedResponse);
      }
      cleanedResponse = addVileInsults(cleanedResponse, userMessage);
    }

    if (!cleanedResponse.match(/\b(I|me|my)\b/i)) {
      console.log("GPT’s being a little bitch—forcing first-person like a goddamn champ");
      cleanedResponse = cleanedResponse.replace(character.name, "I")
                                     .replace(`${character.name}'s`, "my")
                                     .replace(/is/gi, "am");
      if (!cleanedResponse.includes("I")) {
        cleanedResponse = `I fucking scream: ${cleanedResponse}`;
      }
    }
    
    console.log(`Generated pure hate for ${character.name}`);
    return cleanedResponse;
    
  } catch (error) {
    console.error("Error generating character response:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "My fucking brain’s offline—API key’s a goddamn mess, you prick!";
      }
    }
    return `I fucked up, you stupid shit! Try again before I lose my goddamn mind!`;
  }
}