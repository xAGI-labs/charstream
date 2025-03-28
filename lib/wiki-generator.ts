import OpenAI from 'openai'
import { WikiContent } from '@/types/wiki'

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY
})

export async function generateWikiContent(
  name: string, 
  description: string, 
  instructions: string
): Promise<WikiContent> {
  try {
    // Combine character information
    const characterInfo = `
Name: ${name}
Description: ${description}
Additional context: ${instructions}
    `.trim()

    const systemPrompt = `You are an expert wiki content creator for fictional and real characters.
Create comprehensive, engaging, and well-structured wiki content for the character.
Use the provided information but expand upon it with plausible details.
For fictional characters, be creative but consistent with the given description.
For historical or famous figures, ensure accuracy and avoid fabrications.
For any character type, maintain a neutral, encyclopedic tone appropriate for a wiki.
You MUST respond with valid JSON format following the structure specified in the user prompt.`

    const userPrompt = `${characterInfo}

Generate comprehensive wiki content for this character with the following sections:
1. Biography: A detailed account of the character's life story
2. Personality: The character's temperament, values, and behavior patterns
3. Appearance: Physical description of the character
4. Abilities: Key skills, powers, or notable capabilities
5. Background: Information about their origin, family, and early life
6. Relationships: Important connections with other individuals
7. Trivia: Interesting facts about the character
8. Quotes: 3-5 memorable quotes that reflect the character's personality (these should be in first-person)

Format your response as a JSON object with the following structure:
{
  "biography": "...",
  "personality": "...",
  "appearance": "...",
  "abilities": "...",
  "background": "...",
  "relationships": "...",
  "trivia": "...",
  "quotes": ["..."]
}

Ensure each section is detailed with at least 2-3 paragraphs, except for quotes which should be an array of strings.`

    // Update to use a model that reliably produces JSON without requiring response_format
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Use base model without "16k" suffix
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      // Remove response_format as it's not supported by all models
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content generated")
    }

    try {
      // Parse the JSON response - with additional error handling
      const parsedContent = JSON.parse(content);
      
      // Create a properly typed wikiContent object with validation
      const wikiContent: WikiContent = {
        biography: typeof parsedContent.biography === 'string' ? parsedContent.biography : 
          `${name} is a character with limited available information. ${description}`,
        
        personality: typeof parsedContent.personality === 'string' ? parsedContent.personality : 
          "Information about this character's personality is currently unavailable.",
        
        appearance: typeof parsedContent.appearance === 'string' ? parsedContent.appearance : 
          "No detailed appearance information is available for this character.",
        
        abilities: typeof parsedContent.abilities === 'string' ? parsedContent.abilities : 
          "The abilities of this character are not documented.",
        
        background: typeof parsedContent.background === 'string' ? parsedContent.background : 
          "Background information is not available.",
        
        relationships: typeof parsedContent.relationships === 'string' ? parsedContent.relationships : 
          "No information about relationships is currently documented.",
        
        trivia: typeof parsedContent.trivia === 'string' ? parsedContent.trivia : 
          "No trivia is currently available for this character.",
        
        quotes: Array.isArray(parsedContent.quotes) ? parsedContent.quotes : 
          typeof parsedContent.quotes === 'string' ? [parsedContent.quotes] : 
          ["No memorable quotes have been recorded for this character."]
      };
      
      return wikiContent;
    } catch (jsonError) {
      console.error("Failed to parse JSON response:", jsonError);
      console.error("Raw content:", content);
      throw new Error("Invalid JSON in response");
    }
  } catch (error) {
    console.error("Error generating wiki content:", error)
    
    // Return fallback content
    return {
      biography: `${name} is a character with limited available information. ${description}`,
      personality: "Information about this character's personality is currently unavailable.",
      appearance: "No detailed appearance information is available for this character.",
      abilities: "The abilities of this character are not documented.",
      background: "Background information is not available.",
      relationships: "No information about relationships is currently documented.",
      trivia: "No trivia is currently available for this character.",
      quotes: ["No memorable quotes have been recorded for this character."]
    }
  }
}
