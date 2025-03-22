import OpenAI from 'openai';
import { Character } from '@prisma/client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

/**
 * Enriches a character description using AI when the provided description is minimal or generic
 */
export async function enrichCharacterDescription(name: string, userDescription?: string): Promise<{
  enhancedDescription: string;
  avatarPrompt: string;
  isValidCharacter: boolean;
}> {
  try {
    // If description is already detailed (>50 chars), we might not need enrichment
    const needsEnrichment = !userDescription || userDescription.length < 50;
    
    const systemPrompt = `You are an expert on fictional and historical characters. 
Your task is to analyze and enrich character information and ensure accuracy.`;

    const userPrompt = `Character name: "${name}"
${userDescription ? `User-provided description: "${userDescription}"` : "No description provided."}

Please provide the following in JSON format:
1. "enhancedDescription": A concise but enriched description (1-2 sentences) of this character. If this is a known character, ensure accuracy. If it appears to be an original character, expand on the provided description creatively.
2. "avatarPrompt": A detailed prompt for generating a visual portrait of this character (face focus, appearance details).
3. "isValidCharacter": Boolean indicating if this is appropriate content (false if it contains inappropriate, offensive, or harmful content).`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Failed to get AI response for character enrichment");
    }

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(content);
      return {
        enhancedDescription: parsedResponse.enhancedDescription || userDescription || `A character named ${name}`,
        avatarPrompt: parsedResponse.avatarPrompt || `A portrait of ${name}`,
        isValidCharacter: parsedResponse.isValidCharacter !== false, // Default to true if not specified
      };
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      // Return fallback values
      return {
        enhancedDescription: userDescription || `A character named ${name}`,
        avatarPrompt: `A portrait of ${name}`,
        isValidCharacter: true,
      };
    }
  } catch (error) {
    console.error("Error enriching character description:", error);
    // Return the original description if enrichment fails
    return {
      enhancedDescription: userDescription || `A character named ${name}`,
      avatarPrompt: `A portrait of ${name}`,
      isValidCharacter: true,
    };
  }
}

/**
 * Generates comprehensive instructions for a character based on their name and description
 */
export async function generateDetailedInstructions(name: string, description: string): Promise<string> {
  try {
    const systemPrompt = `You are an expert on creating AI character roleplaying instructions.
Your task is to create clear and effective instructions for an AI to accurately portray this character in first-person perspective.`;

    const userPrompt = `Character name: "${name}"
Character description: "${description}"

Generate roleplaying instructions for an AI to become this character. The AI must respond AS THE CHARACTER in first person, not describe the character in third person.

Your instructions should include:
1. A clear statement like "You are [character name]. Respond as if you ARE this character, in first person perspective."
2. Key personality traits that should be expressed in responses
3. Speech patterns and vocabulary the character would use
4. Knowledge boundaries (what they would and wouldn't know)
5. How they would react to various situations

IMPORTANT: Do NOT write a biography. These instructions should tell the AI how to BECOME the character.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const instructions = response.choices[0]?.message?.content;
    if (!instructions) {
      throw new Error("Failed to generate character instructions");
    }

    return instructions;
  } catch (error) {
    console.error("Error generating detailed instructions:", error);
    // Return basic instructions as fallback
    return `You are ${name}. ${description}. Respond as this character would, maintaining their tone, knowledge, and personality throughout the conversation.`;
  }
}
