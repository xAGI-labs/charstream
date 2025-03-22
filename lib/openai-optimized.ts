import OpenAI from 'openai';

// Initialize OpenAI client once
const openaiClient = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  timeout: 10000, // Reduce timeout to 10s for faster failover
  maxRetries: 1, // Minimal retries for low latency
});

// Export function to get the OpenAI client
export function getOpenAIClient() {
  return openaiClient;
}

// Define types that match OpenAI SDK's expected format
type MessageRole = 'system' | 'user' | 'assistant' | 'function';

interface Message {
  role: MessageRole;
  content: string;
  name?: string; // Required for function role, optional otherwise
}

/**
 * Optimized function to get faster responses from OpenAI
 */
export async function getFastResponse({
  messages,
  systemPrompt,
  model = 'gpt-3.5-turbo',
  temperature = 0.3, // Lower for more deterministic responses
  maxTokens = 300, // Lower token limit for quicker responses
  stream = false,
}: {
  messages: Message[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}) {
  // Combine system prompt if provided
  const allMessages = systemPrompt
    ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
    : messages;

  // Optimize token usage by truncating unnecessary messages
  const truncatedMessages = truncateContext(allMessages);

  if (stream) {
    // Streaming response handling
    const response = await openaiClient.chat.completions.create({
      model,
      messages: truncatedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    // Stream response manually
    let finalResponse = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content); // Immediate response streaming
      finalResponse += content;
    }

    return finalResponse;
  } else {
    // Standard API response (non-streaming)
    const response = await openaiClient.chat.completions.create({
      model,
      messages: truncatedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}

/**
 * Truncates conversation history for faster response times
 */
function truncateContext(messages: Message[]): Message[] {
  const systemMessage = messages.find((msg) => msg.role === 'system');
  const latestMessage = messages[messages.length - 1];

  if (messages.length <= 5) return messages;

  const truncated = [
    ...(systemMessage ? [systemMessage] : []),
    ...messages.slice(-4), // Keep last 4 user/assistant interactions
  ];

  return truncated;
}

/**
 * Minimal prompt execution for fastest responses
 */
export async function getQuickCompletion(prompt: string, maxTokens = 150) {
  const response = await openaiClient.completions.create({
    model: 'gpt-3.5-turbo-instruct',
    prompt,
    max_tokens: maxTokens,
    temperature: 0.3,
  });

  return response.choices[0]?.text ?? '';
}
