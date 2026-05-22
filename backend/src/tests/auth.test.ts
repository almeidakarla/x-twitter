import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/auth.utils.js';

describe('Auth Controller', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.like.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.tweet.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for duplicate email', async () => {
      // Create a user first
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'existinguser',
          password: await hashPassword('password123'),
          name: 'Existing User',
        },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'newuser',
          password: 'password123',
          name: 'New User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
    });

    it('should return 400 for duplicate username', async () => {
      await prisma.user.create({
        data: {
          email: 'existing@example.com',
          username: 'testuser',
          password: await hashPassword('password123'),
          name: 'Existing User',
        },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          username: 'testuser',
          password: 'password123',
          name: 'New User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already taken');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'short',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid username characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'test user!',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
          password: await hashPassword('password123'),
          name: 'Test User',
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          name: 'Test User',
        });
      token = response.body.token;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          name: 'Test User',
        });
      token = response.body.token;
    });

    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          bio: 'Updated bio',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Updated Name');
      expect(response.body.user.bio).toBe('Updated bio');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
    });
  });
});
