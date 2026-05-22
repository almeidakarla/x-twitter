import { prisma } from '../lib/prisma.js';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Clean up database before tests
beforeAll(async () => {
  // Ensure we're using test database
  console.log('Setting up test environment...');
});

// Clean up after all tests
afterAll(async () => {
  // Clean up all data
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.user.deleteMany();

  await prisma.$disconnect();
});

// Global test timeout
jest.setTimeout(30000);
