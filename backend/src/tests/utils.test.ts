import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from '../utils/auth.utils.js';

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(password, hashed);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testpassword123';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword('wrongpassword', hashed);

      expect(isMatch).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.username).toBe(payload.username);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw for tampered token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyToken(tamperedToken)).toThrow();
    });
  });
});
