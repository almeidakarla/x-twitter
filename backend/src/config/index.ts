export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/avif',
      'image/svg+xml',
      'image/bmp',
      'image/tiff',
    ] as string[],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};

export type Config = typeof config;
