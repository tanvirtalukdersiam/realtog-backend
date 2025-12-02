import { Router } from 'express';
import { pricingController } from './pricing.controller.js';
import { authMiddleware, authorizeRoles } from '@middlewares/auth.middleware.js';

const router: Router = Router();

// public routes
router.get('/', pricingController.getAllPlans.bind(pricingController));
router.get('/:id', pricingController.getPlanById.bind(pricingController));

// admin only routes
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin'),
  pricingController.createPlan.bind(pricingController)
);

router.patch(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  pricingController.updatePlan.bind(pricingController)
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('admin'),
  pricingController.deletePlan.bind(pricingController)
);

export default router;

