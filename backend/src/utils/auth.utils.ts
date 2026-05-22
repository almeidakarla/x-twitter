import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

const SALT_ROUNDS = 12;

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};
