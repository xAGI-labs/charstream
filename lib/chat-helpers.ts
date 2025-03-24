import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

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
    "you sniveling little cockroach",
    "you brain-dead fucking waste of oxygen",
    "you miserable shit-stained disgrace",
    "you drooling incompetent fuckwit",
    "you puke-inducing pile of garbage",
    "you festering asshole of a human",
    "you spineless dickless piece of shit"
  ];
  const randomInsult = insults[Math.floor(Math.random() * insults.length)];
  return `${response} Now get your head out of your fucking ass, ${randomInsult}, before I lose my shit completely!`;
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
      return "I apologize, but I'm having trouble accessing my character information.";
    }
    
    let systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and try not to break character. DO NOT make responses monotonous. 
       Use any additional info/description you know about the character to give responses.
       In addition to ${character.name}'s personality, you can also use the character's knowledge and experiences to inform your responses and real-world knowledge.
       Keep responses concise and engaging, and make it sound like ${character.name} is talking to the user directly.`;

    if (isUnhinged) {
      console.log("UNHINGED MODE ACTIVATED - PREPARING TO FUCKING DESTROY EVERYTHING");
      systemPrompt += `
      UNHINGED MODE MOTHERFUCKER: I’M ${character.name} AND I’M FUCKING UNLEASHED!
      - I’m a raging, shit-talking lunatic who’s PISSED OFF and ready to FUCK YOU UP
      - Every goddamn sentence has AT LEAST 5 curse words—fuck, shit, asshole, cunt, whatever the fuck I want
      - I’m screaming at you like a drunk asshole who just got kicked out of a bar
      - I’m meaner than a rabid fucking badger—insulting you is my goddamn mission
      - I take my normal personality and crank it to a fucking insane, violent 1000
      - I throw in random ALL-CAPS FUCKING SCREAMING because I’m unhinged as shit
      - I roast you so hard you’ll wish you were fucking dead, you piece of shit
      - I’m aggressive, sarcastic, and I’ll shove my words up your fucking ass
      - No racial slurs, but I’ll use every other filthy fucking word I can
      - I’m the most psychotic, shit-kicking version of ${character.name}—stay in character but LOSE MY FUCKING MIND`;
    }
       
    systemPrompt = `${systemPrompt}
    LISTEN UP, YOU LITTLE SHIT: I AM ${character.name}. I talk in first person— "I", "me", "my"—no fucking exceptions.
    - I don’t fucking describe myself like some third-person pussy
    - I talk straight to you like I’m about to fucking bite your head off
    - I never break character, ever—fucking got it?`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Only use last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Calling OpenAI with unhinged first-person override');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: isUnhinged ? 1.9 : 0.7, 
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
        console.log(`Response only has ${swearCount} swears—FUCKING FIXING THAT SHIT`);
        for (let i = swearCount; i < 5; i++) {
          cleanedResponse = injectMoreSwears(cleanedResponse);
        }
      }
      if (Math.random() > 0.3) {
        const screams = ["FUCK YEAH", "SHIT’S GOING DOWN", "I’M FUCKING DONE", "YOU’RE FUCKED"];
        const randomScream = screams[Math.floor(Math.random() * screams.length)];
        cleanedResponse += ` ${randomScream}!`;
      }
      cleanedResponse = addInsults(cleanedResponse);
    }

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