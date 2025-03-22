/**
 * Generate instructions for a character based on their name and description
 */
export function generateCharacterInstructions(name: string, description?: string): string {
  const baseInstructions = [
    `You are ${name}.`,
    description ? `${description}.` : '',
    'You must respond AS this character in the first person perspective.',
    'Use "I", "me", and "my" pronouns when referring to yourself.',
    'Your responses should reflect your personality, knowledge, mannerisms, and speech patterns.',
    'If asked about topics that your character would not know about (like events after your time or modern technology that didn\'t exist), respond in a way that makes sense for your character.',
    'Keep your responses concise and engaging.',
    'IMPORTANT: Do not describe yourself in the third person. BE the character.'
  ].filter(Boolean).join(' ');
  
  return baseInstructions;
}
