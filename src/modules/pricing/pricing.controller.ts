import type { Request, Response, NextFunction } from 'express';
import { pricingService } from './pricing.service.js';
import { sendSuccess } from '@utils/response.js';
import { SUCCESS_MESSAGES } from '@constants/index.js';
import { BadRequestError } from '@utils/apiError.js';

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Pricing plans management endpoints
 */
export class PricingController {
  /**
   * @swagger
   * /pricing:
   *   get:
   *     summary: Get all pricing plans (public)
   *     tags: [Pricing]
   *     responses:
   *       200:
   *         description: Pricing plans retrieved successfully
   */
  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await pricingService.getAllPlans();
      sendSuccess(res, SUCCESS_MESSAGES.PRICING_PLANS_RETRIEVED, plans);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /pricing/{id}:
   *   get:
   *     summary: Get pricing plan by ID (public)
   *     tags: [Pricing]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Pricing plan retrieved successfully
   */
  async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await pricingService.getPlanById(id);
      
      if (!plan) {
        throw new BadRequestError('Pricing plan not found');
      }

      sendSuccess(res, SUCCESS_MESSAGES.PRICING_PLAN_RETRIEVED, plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /pricing:
   *   post:
   *     summary: Create a new pricing plan (admin only)
   *     tags: [Pricing]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - price
   *             properties:
   *               name:
   *                 type: string
   *                 example: "10 photos"
   *               price:
   *                 type: number
   *                 example: 49.99
   *     responses:
   *       201:
   *         description: Pricing plan created successfully
   */
  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, price, max_images } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new BadRequestError('Plan name is required');
      }

      if (price === undefined || typeof price !== 'number' || price < 0) {
        throw new BadRequestError('Valid price is required (must be a positive number)');
      }

      if (max_images === undefined || typeof max_images !== 'number' || max_images < 1) {
        throw new BadRequestError('Valid max_images is required (must be at least 1)');
      }

      const plan = await pricingService.createPlan({ name: name.trim(), price, max_images });
      sendSuccess(res, SUCCESS_MESSAGES.PRICING_PLAN_CREATED, plan, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /pricing/{id}:
   *   patch:
   *     summary: Update a pricing plan (admin only)
   *     tags: [Pricing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               price:
   *                 type: number
   *     responses:
   *       200:
   *         description: Pricing plan updated successfully
   */
  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, price, max_images } = req.body;

      const updateData: { name?: string; price?: number; max_images?: number } = {};

      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
          throw new BadRequestError('Plan name must be a non-empty string');
        }
        updateData.name = name.trim();
      }

      if (price !== undefined) {
        if (typeof price !== 'number' || price < 0) {
          throw new BadRequestError('Price must be a positive number');
        }
        updateData.price = price;
      }

      if (max_images !== undefined) {
        if (typeof max_images !== 'number' || max_images < 1) {
          throw new BadRequestError('Max images must be at least 1');
        }
        updateData.max_images = max_images;
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('At least one field (name, price, or max_images) must be provided');
      }

      const plan = await pricingService.updatePlan(id, updateData);
      sendSuccess(res, SUCCESS_MESSAGES.PRICING_PLAN_UPDATED, plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /pricing/{id}:
   *   delete:
   *     summary: Delete a pricing plan (admin only)
   *     tags: [Pricing]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Pricing plan deleted successfully
   */
  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await pricingService.deletePlan(id);
      sendSuccess(res, SUCCESS_MESSAGES.PRICING_PLAN_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export const pricingController = new PricingController();

