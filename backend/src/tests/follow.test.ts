import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/auth.utils.js';

describe('Follow Controller', () => {
  let token: string;
  let userId: string;
  let otherUserId: string;
  let otherUsername: string;

  beforeEach(async () => {
    // Clean up database
    await prisma.like.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.tweet.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: 'user1',
        password: await hashPassword('password123'),
        name: 'User One',
      },
    });
    userId = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        username: 'user2',
        password: await hashPassword('password123'),
        name: 'User Two',
      },
    });
    otherUserId = user2.id;
    otherUsername = user2.username;

    // Get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'password123' });
    token = response.body.token;
  });

  describe('POST /api/follows/:username', () => {
    it('should follow a user successfully', async () => {
      const response = await request(app)
        .post(`/api/follows/${otherUsername}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.followersCount).toBe(1);
    });

    it('should return 400 when trying to follow yourself', async () => {
      const response = await request(app)
        .post('/api/follows/user1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("You can't follow yourself");
    });

    it('should return 400 when already following', async () => {
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: otherUserId,
        },
      });

      const response = await request(app)
        .post(`/api/follows/${otherUsername}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Already following this user');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/follows/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post(`/api/follows/${otherUsername}`);
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/follows/:username', () => {
    beforeEach(async () => {
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: otherUserId,
        },
      });
    });

    it('should unfollow a user successfully', async () => {
      const response = await request(app)
        .delete(`/api/follows/${otherUsername}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.followersCount).toBe(0);
    });

    it('should return 400 when not following', async () => {
      // Unfollow first
      await prisma.follow.deleteMany({
        where: {
          followerId: userId,
          followingId: otherUserId,
        },
      });

      const response = await request(app)
        .delete(`/api/follows/${otherUsername}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Not following this user');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/follows/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});

describe('User Controller', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    await prisma.like.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.tweet.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        username: 'user1',
        password: await hashPassword('password123'),
        name: 'User One',
        bio: 'Test bio',
      },
    });
    userId = user.id;

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'password123' });
    token = response.body.token;
  });

  describe('GET /api/users/:username', () => {
    it('should return user profile', async () => {
      const response = await request(app)
        .get('/api/users/user1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('user1');
      expect(response.body.user.name).toBe('User One');
      expect(response.body.user.isOwnProfile).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should work without authentication', async () => {
      const response = await request(app).get('/api/users/user1');

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('user1');
    });
  });

  describe('GET /api/users/:username/followers', () => {
    beforeEach(async () => {
      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          username: 'user2',
          password: await hashPassword('password123'),
          name: 'User Two',
        },
      });

      await prisma.follow.create({
        data: {
          followerId: user2.id,
          followingId: userId,
        },
      });
    });

    it('should return followers list', async () => {
      const response = await request(app)
        .get('/api/users/user1/followers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].username).toBe('user2');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent/followers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/:username/following', () => {
    beforeEach(async () => {
      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          username: 'user2',
          password: await hashPassword('password123'),
          name: 'User Two',
        },
      });

      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: user2.id,
        },
      });
    });

    it('should return following list', async () => {
      const response = await request(app)
        .get('/api/users/user1/following')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].username).toBe('user2');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent/following')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
