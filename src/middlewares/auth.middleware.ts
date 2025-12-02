import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwt.js';
import { UnauthorizedError } from '@utils/apiError.js';
import type { JWTPayload } from '@utils/jwt.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'admin' | 'moderator' | 'user';
  };
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // get token from authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization token required');
    }

    const token = authHeader.substring(7); // remove 'Bearer ' prefix

    // verify token
    const decoded = verifyToken(token);

    // attach user to request
    (req as AuthRequest).user = {
      userId: (decoded as JWTPayload).userId,
      email: (decoded as JWTPayload).email,
      role: (decoded as JWTPayload).role,
    };

    next();
  } catch (error: any) {
    next(new UnauthorizedError(error.message || 'Invalid or expired token'));
  }
};

export const authorizeRoles = (
  ...allowedRoles: Array<'admin' | 'moderator' | 'user'>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      next(new UnauthorizedError('Unauthorized access'));
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      next(new UnauthorizedError('Insufficient permissions'));
      return;
    }

    next();
  };
};

