import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/auth.utils.js';

describe('Tweet Controller', () => {
  let token: string;
  let userId: string;
  let otherUserId: string;
  let otherToken: string;

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

    // Get tokens
    const response1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user1@example.com', password: 'password123' });
    token = response1.body.token;

    const response2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' });
    otherToken = response2.body.token;
  });

  describe('POST /api/tweets', () => {
    it('should create a tweet successfully', async () => {
      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello, World!' });

      expect(response.status).toBe(201);
      expect(response.body.tweet.content).toBe('Hello, World!');
      expect(response.body.tweet.author.username).toBe('user1');
    });

    it('should return 400 for empty content', async () => {
      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for content exceeding 280 characters', async () => {
      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'a'.repeat(281) });

      expect(response.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/tweets')
        .send({ content: 'Hello!' });

      expect(response.status).toBe(401);
    });

    it('should create a reply tweet', async () => {
      // Create parent tweet
      const parent = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Parent tweet' });

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          content: 'This is a reply',
          parentId: parent.body.tweet.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.tweet.parentId).toBe(parent.body.tweet.id);
    });

    it('should return 404 for invalid parent tweet', async () => {
      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'This is a reply',
          parentId: '00000000-0000-0000-0000-000000000000',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tweets/timeline', () => {
    beforeEach(async () => {
      // User1 follows User2
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: otherUserId,
        },
      });

      // Create tweets
      await prisma.tweet.create({
        data: {
          content: 'Tweet from user2',
          authorId: otherUserId,
        },
      });

      await prisma.tweet.create({
        data: {
          content: 'Tweet from user1',
          authorId: userId,
        },
      });
    });

    it('should return timeline with followed users tweets', async () => {
      const response = await request(app)
        .get('/api/tweets/timeline')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tweets.length).toBe(2);
    });

    it('should paginate timeline', async () => {
      const response = await request(app)
        .get('/api/tweets/timeline?limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tweets.length).toBe(1);
      expect(response.body.hasMore).toBe(true);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/tweets/timeline');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tweets/user/:username', () => {
    beforeEach(async () => {
      await prisma.tweet.create({
        data: {
          content: 'Tweet from user1',
          authorId: userId,
        },
      });
    });

    it('should return user tweets', async () => {
      const response = await request(app)
        .get('/api/tweets/user/user1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tweets.length).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/tweets/user/nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tweets/:id', () => {
    let tweetId: string;

    beforeEach(async () => {
      const tweet = await prisma.tweet.create({
        data: {
          content: 'Test tweet',
          authorId: userId,
        },
      });
      tweetId = tweet.id;
    });

    it('should return a tweet by ID', async () => {
      const response = await request(app)
        .get(`/api/tweets/${tweetId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tweet.id).toBe(tweetId);
    });

    it('should return 404 for non-existent tweet', async () => {
      const response = await request(app)
        .get('/api/tweets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tweets/:id', () => {
    let tweetId: string;

    beforeEach(async () => {
      const tweet = await prisma.tweet.create({
        data: {
          content: 'Tweet to delete',
          authorId: userId,
        },
      });
      tweetId = tweet.id;
    });

    it('should delete own tweet', async () => {
      const response = await request(app)
        .delete(`/api/tweets/${tweetId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should return 403 when deleting other user tweet', async () => {
      const response = await request(app)
        .delete(`/api/tweets/${tweetId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent tweet', async () => {
      const response = await request(app)
        .delete('/api/tweets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tweets/:id/like', () => {
    let tweetId: string;

    beforeEach(async () => {
      const tweet = await prisma.tweet.create({
        data: {
          content: 'Tweet to like',
          authorId: otherUserId,
        },
      });
      tweetId = tweet.id;
    });

    it('should like a tweet', async () => {
      const response = await request(app)
        .post(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.likesCount).toBe(1);
    });

    it('should return 400 when liking already liked tweet', async () => {
      await request(app)
        .post(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .post(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent tweet', async () => {
      const response = await request(app)
        .post('/api/tweets/00000000-0000-0000-0000-000000000000/like')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tweets/:id/like', () => {
    let tweetId: string;

    beforeEach(async () => {
      const tweet = await prisma.tweet.create({
        data: {
          content: 'Tweet to unlike',
          authorId: otherUserId,
        },
      });
      tweetId = tweet.id;

      // Like the tweet first
      await prisma.like.create({
        data: {
          userId: userId,
          tweetId: tweetId,
        },
      });
    });

    it('should unlike a tweet', async () => {
      const response = await request(app)
        .delete(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.likesCount).toBe(0);
    });

    it('should return 400 when unliking not liked tweet', async () => {
      // Unlike first
      await request(app)
        .delete(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .delete(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tweets/:id/replies', () => {
    let parentTweetId: string;

    beforeEach(async () => {
      const parent = await prisma.tweet.create({
        data: {
          content: 'Parent tweet',
          authorId: userId,
        },
      });
      parentTweetId = parent.id;

      await prisma.tweet.create({
        data: {
          content: 'Reply 1',
          authorId: otherUserId,
          parentId: parentTweetId,
        },
      });

      await prisma.tweet.create({
        data: {
          content: 'Reply 2',
          authorId: userId,
          parentId: parentTweetId,
        },
      });
    });

    it('should return replies for a tweet', async () => {
      const response = await request(app)
        .get(`/api/tweets/${parentTweetId}/replies`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.replies.length).toBe(2);
    });
  });
});
