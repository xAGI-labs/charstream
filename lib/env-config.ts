/**
 * Environment configuration with default values and type safety
 */

// These are safe to expose in client-side code
export const clientEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Server-side only environment variables
export const serverEnv = {
  // API Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  TOGETHER_API_KEY: process.env.TOGETHER_API_KEY,
  
  // Image generation worker
  IMAGE_GENERATION_WORKER_URL: process.env.IMAGE_GENERATION_WORKER_URL || 'https://api.together.xyz/v1/images/generations',
  
  // Cloudinary configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || 'chatstream_avatars',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Auth
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  
  // Feature flags
  ENABLE_IMAGE_PROXY: process.env.ENABLE_IMAGE_PROXY === 'true',
  
  // Determine if we're in development or production
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

/**
 * Check that all required environment variables are set
 */
export function validateServerEnv(): string[] {
  const missing: string[] = [];
  
  // Required variables - add all required variables here
  const required = [
    'DATABASE_URL',
    'CLERK_SECRET_KEY'
  ];
  
  // Check for missing required variables
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // Recommended but not required variables
  const recommended = [
    'OPENAI_API_KEY',
    'TOGETHER_API_KEY',
    'CLOUDINARY_API_KEY',
    'IMAGE_GENERATION_WORKER_URL'
  ];
  
  // Log warnings for recommended variables
  recommended.forEach(varName => {
    if (!process.env[varName] && missing.indexOf(varName) === -1) {
      console.warn(`⚠️ Warning: Recommended env variable ${varName} is not set`);
    }
  });
  
  return missing;
}
