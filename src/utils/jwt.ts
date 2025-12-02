import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '@config/index.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret as unknown as string, {
    expiresIn: config.jwtExpiresIn as unknown as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwtSecret as unknown as string) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

