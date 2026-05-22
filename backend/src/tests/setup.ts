import { prisma } from '../lib/prisma.js';

// Clean up database before tests
beforeAll(async () => {
  // Use a test database
  process.env.NODE_ENV = 'test';
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Global test timeout
jest.setTimeout(30000);
