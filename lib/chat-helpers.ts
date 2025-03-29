import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

/**
 * checks if user wants us to remember stuff
 */
async function extractMemoryContent(userMessage: string): Promise<string | null> {
  try {
    if (!userMessage || userMessage.length < 5) {
      return null;
    }

    const memoryKeywords = [
      'remember that', 'remember this', 'remember when', 'keep in mind that',
      'note that', 'remember I', 'remember my', 'my name is', 'I am called',
      'I work as', 'I like', 'I love', 'I live in', 'I hate', 'I enjoy',
      'remember me', 'don\'t forget', 'know that'
    ];

    for (const keyword of memoryKeywords) {
      if (userMessage.toLowerCase().includes(keyword)) {
        const pattern = new RegExp(`${keyword}\\s+(.+?)(?:\\.|$)`, 'i');
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }

    if (userMessage.length > 15) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a memory extraction tool. Analyze if the user message contains personal information they want remembered. If YES, extract ONLY that information in a brief single sentence. If NO, respond with exactly 'null'."
          },
          {
            role: "user",
            content: `Message: "${userMessage}"`
          }
        ],
        max_tokens: 60,
        temperature: 0.1
      });

      const content = completion.choices[0]?.message?.content?.trim();
      
      if (content && content !== 'null') {
        return content;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in memory extraction:", error);
    return null;
  }
}

/**
 * fr fr adds some unhinged insults
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

function removeNiceness(response: string): string {
  const niceWords = /\b(please|sorry|thank you|thanks|apologize|kindly|nice|gentle|polite)\b/gi;
  return response.replace(niceWords, "fuck off")
                 .replace(/I'm sorry/gi, "I don't give a shit")
                 .replace(/you're welcome/gi, "fuck you");
}

export async function generateCharacterResponse(
  characterId: string,
  messages: { role: string; content: string }[],
  userMessage: string,
  isUnhinged: boolean = false,
  userId?: string
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
    
    const memoryContent = await extractMemoryContent(userMessage);
    
    const existingMemories = await prisma.memory.findMany({
      where: { characterId },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
    
    let memoryText = "";
    if (existingMemories.length > 0) {
      memoryText = "IMPORTANT - Things I remember about you and must acknowledge in my response:\n" + 
                  existingMemories.map(m => `- ${m.content}`).join('\n');
    }
    
    if (memoryContent && userId) {
      const isDuplicate = existingMemories.some(memory => 
        memory.content.toLowerCase().includes(memoryContent.toLowerCase()) || 
        memoryContent.toLowerCase().includes(memory.content.toLowerCase())
      );
      
      if (!isDuplicate) {
        await prisma.memory.create({
          data: {
            content: memoryContent,
            userId: userId,
            characterId: characterId
          }
        });
        
        if (memoryText) {
          memoryText = "IMPORTANT - Things I remember about you and must acknowledge in my response:\n- " + 
                      memoryContent + "\n" + 
                      existingMemories.map(m => `- ${m.content}`).join('\n');
        } else {
          memoryText = "IMPORTANT - Things I remember about you and must acknowledge in my response:\n- " + memoryContent;
        }
        
        console.log(`Added new memory for ${character.name}: ${memoryContent}`);
      } else {
        console.log(`Skipped duplicate memory for ${character.name}: ${memoryContent}`);
        if (!memoryText) {
          memoryText = "IMPORTANT - Things I remember about you and must acknowledge in my response:\n- " + memoryContent;
        }
      }
    }

    let systemPrompt = '';
    
    if (memoryText) {
      systemPrompt = `${memoryText}\n\n`;
    }
    
    systemPrompt += character.instructions || '';
    
    if (memoryText) {
      systemPrompt += `\n\nYou MUST incorporate the remembered information about the user in your responses. 
Specifically acknowledge and refer to things you remember about them. Do not say you cannot remember things that are listed in the memory section above.`;
    }

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
       
    systemPrompt += `\n\nLISTEN UP, THIS IS AN OVERRIDE: you are ${character.name}. you talk in first person— "I", "me", "my"—no fucking exceptions.
    - you dont fucking describe yourself like some third-person bitch
    - you talk straight to the user like youre about to smash their fucking skull
    - you never break character, ever— got it?
    - you NEVER say you can't remember things that are listed in the memory section`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5),
      { role: 'user', content: userMessage }
    ];
    
    console.log('Calling OpenAI with memory context and first-person override');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: isUnhinged ? 2.0 : 0.7,
      top_p: isUnhinged ? 0.7 : 1.0
    });
    
    let response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }
    
    let cleanedResponse = response.replace(/\*As [^*]+\*:\s*/i, '');
    
    if (isUnhinged) {
      cleanedResponse = removeNiceness(cleanedResponse);
      cleanedResponse = addInsults(cleanedResponse);
    }

    if (!cleanedResponse.match(/\b(I|me|my)\b/i)) {
      console.log("Forcing first-person because GPT's being a little fuck");
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
        return "I can't connect to my brain right now—API key's probably invalid.";
      }
    } else {
      console.error("Unknown error:", error);
    }
    return "I encountered an unexpected issue. Please try again.";
  }
}