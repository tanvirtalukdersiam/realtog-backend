import { Router } from 'express';
import { userController } from './user.controller.js';
import { authMiddleware, authorizeRoles } from '@middlewares/auth.middleware.js';

const router: Router = Router();

// get all users route (protected)
router.get('/', authMiddleware, userController.getAllUsers.bind(userController));

// update user role (admin only)
router.patch(
  '/:id/role',
  authMiddleware,
  authorizeRoles('admin'),
  userController.updateUserRole.bind(userController)
);

export default router;

