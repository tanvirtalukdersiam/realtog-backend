import type { Request, Response, NextFunction } from 'express';
import { orderService } from './order.service.js';
import { sendSuccess } from '@utils/response.js';
import { SUCCESS_MESSAGES } from '@constants/index.js';
import { BadRequestError } from '@utils/apiError.js';
import type { AuthRequest } from '@middlewares/auth.middleware.js';
import type { OrderStatus } from './order.model.js';

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */
export class OrderController {
  /**
   * @swagger
   * /orders:
   *   post:
   *     summary: Create a new order (customer)
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - plan_id
   *               - images
   *             properties:
   *               plan_id:
   *                 type: string
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       201:
   *         description: Order created successfully
   */
  async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const { plan_id } = req.body;
      if (!plan_id) {
        throw new BadRequestError('plan_id is required');
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new BadRequestError('At least one image is required');
      }

      const order = await orderService.createOrder(userId, plan_id, files);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_CREATED, order, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /orders:
   *   get:
   *     summary: Get user's orders (customer) or all orders (admin)
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Orders retrieved successfully
   */
  async getOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      let orders;
      if (role === 'admin') {
        orders = await orderService.getAllOrders();
      } else {
        orders = await orderService.getUserOrders(userId);
      }

      sendSuccess(res, SUCCESS_MESSAGES.ORDERS_RETRIEVED, orders);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /orders/{id}:
   *   get:
   *     summary: Get order by ID
   *     tags: [Orders]
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
   *         description: Order retrieved successfully
   */
  async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const role = req.user?.role;

      const order = await orderService.getOrderById(id, role === 'admin' ? undefined : userId);

      if (!order) {
        throw new BadRequestError('Order not found');
      }

      sendSuccess(res, SUCCESS_MESSAGES.ORDER_RETRIEVED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /orders/{id}/status:
   *   patch:
   *     summary: Update order status (admin only)
   *     tags: [Orders]
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
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [In Progress, Delivered, Revision, Completed]
   *     responses:
   *       200:
   *         description: Order status updated successfully
   */
  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: OrderStatus };

      if (!status || !['In Progress', 'Delivered', 'Revision', 'Completed'].includes(status)) {
        throw new BadRequestError('Valid status is required');
      }

      const order = await orderService.updateOrderStatus(id, status);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_STATUS_UPDATED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /orders/{id}/submission:
   *   post:
   *     summary: Upload ZIP submission (admin only)
   *     tags: [Orders]
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
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - zip_file
   *             properties:
   *               zip_file:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Submission uploaded successfully
   */
  async uploadSubmission(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        throw new BadRequestError('ZIP file is required');
      }

      const submission = await orderService.uploadSubmission(id, file);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_SUBMISSION_UPLOADED, submission, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();

