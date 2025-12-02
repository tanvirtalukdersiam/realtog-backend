import type { Request, Response, NextFunction } from 'express';
import { userService } from './user.service.js';
import { sendSuccess } from '@utils/response.js';
import { SUCCESS_MESSAGES } from '@constants/index.js';
import { BadRequestError, NotFoundError } from '@utils/apiError.js';
import { ERROR_MESSAGES } from '@constants/index.js';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */
export class UserController {
  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       _id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       email:
   *                         type: string
   *                       phone:
   *                         type: string
   *                       emailVerified:
   *                         type: boolean
   *                       provider:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                       updatedAt:
   *                         type: string
   *       401:
   *         description: Unauthorized
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      sendSuccess(res, SUCCESS_MESSAGES.USERS_RETRIEVED, users);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body as { role?: 'admin' | 'moderator' | 'user' };

      if (!role || !['admin', 'moderator', 'user'].includes(role)) {
        throw new BadRequestError('Invalid role specified');
      }

      const updatedUser = await userService.updateUserRole(id, role);

      if (!updatedUser) {
        throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      sendSuccess(res, SUCCESS_MESSAGES.USER_ROLE_UPDATED, updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

