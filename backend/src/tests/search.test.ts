import request from 'supertest';
import app from '../app.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../utils/auth.utils.js';

describe('Search Controller', () => {
  let token: string;

  beforeEach(async () => {
    await prisma.like.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.tweet.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    await prisma.user.create({
      data: {
        email: 'john@example.com',
        username: 'johndoe',
        password: await hashPassword('password123'),
        name: 'John Doe',
        bio: 'Software Engineer',
      },
    });

    await prisma.user.create({
      data: {
        email: 'jane@example.com',
        username: 'janesmith',
        password: await hashPassword('password123'),
        name: 'Jane Smith',
        bio: 'Product Designer',
      },
    });

    await prisma.user.create({
      data: {
        email: 'bob@example.com',
        username: 'bobwilson',
        password: await hashPassword('password123'),
        name: 'Bob Wilson',
        bio: 'Data Scientist',
      },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'password123' });
    token = response.body.token;
  });

  describe('GET /api/search/users', () => {
    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/search/users?q=john')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].username).toBe('johndoe');
    });

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/search/users?q=Jane')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
      expect(response.body.users[0].name).toBe('Jane Smith');
    });

    it('should return multiple matches', async () => {
      const response = await request(app)
        .get('/api/search/users?q=o')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/search/users?q=nonexistent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(0);
    });

    it('should work without authentication', async () => {
      const response = await request(app).get('/api/search/users?q=john');

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
    });

    it('should return empty for empty query', async () => {
      const response = await request(app)
        .get('/api/search/users?q=')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/search/users?q=o&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBe(1);
    });
  });
});

describe('Health Check', () => {
  it('should return OK status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not found');
  });
});
