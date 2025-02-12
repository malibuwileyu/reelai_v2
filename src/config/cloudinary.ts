import { v2 as cloudinary } from 'cloudinary';

// Validate environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'EXPO_PUBLIC_CLOUDINARY_API_KEY',
  'EXPO_PUBLIC_CLOUDINARY_API_SECRET'
] as const;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Initialize Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET,
  secure: true
});

export { cloudinary }; 