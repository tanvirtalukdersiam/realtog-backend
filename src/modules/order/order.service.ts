import { Order, OrderImage, OrderSubmission, IOrder, IOrderImage, IOrderSubmission, OrderStatus } from './order.model.js';
import { Pricing } from '../pricing/pricing.model.js';
import { NotFoundError, BadRequestError } from '@utils/apiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '@utils/cloudinary.js';
import logger from '@utils/logger.js';
import mongoose from 'mongoose';

export class OrderService {
  // create order with images
  async createOrder(
    userId: string,
    planId: string,
    files: Express.Multer.File[]
  ): Promise<IOrder> {
    // Get pricing plan
    const plan = await Pricing.findById(planId);
    if (!plan) {
      throw new NotFoundError('Pricing plan not found');
    }

    // Validate image count
    if (files.length === 0) {
      throw new BadRequestError('At least one image is required');
    }

    if (files.length > plan.max_images) {
      throw new BadRequestError(
        `Maximum ${plan.max_images} images allowed for this plan. You uploaded ${files.length} images.`
      );
    }

    // Create order first (without images, we'll update it)
    const order = new Order({
      user: new mongoose.Types.ObjectId(userId),
      plan: new mongoose.Types.ObjectId(planId),
      status: 'In Progress',
      images: [],
      submissions: [],
    });
    await order.save();

    // Upload images to Cloudinary
    const uploadedImages: IOrderImage[] = [];
    try {
      for (const file of files) {
        // Validate file buffer
        if (!file.buffer || file.buffer.length === 0) {
          throw new BadRequestError(`File ${file.originalname} is empty or corrupted`);
        }

        const uploadResult = await uploadToCloudinary(file, 'orders/images');
        const orderImage = new OrderImage({
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          orderId: order._id,
        });
        await orderImage.save();
        uploadedImages.push(orderImage);
      }

      // Update order with image references
      order.images = uploadedImages.map((img) => img._id as mongoose.Types.ObjectId);
      await order.save();
    } catch (error: any) {
      // Log the actual error for debugging
      logger.error('Error uploading images to Cloudinary:', {
        error: error.message,
        stack: error.stack,
        filesCount: files.length,
      });

      // Clean up uploaded images on error
      for (const image of uploadedImages) {
        try {
          await deleteFromCloudinary(image.public_id);
          await OrderImage.findByIdAndDelete(image._id);
        } catch (cleanupError) {
          logger.error('Error cleaning up image:', cleanupError);
        }
      }

      // Delete the order if image upload failed
      try {
        await Order.findByIdAndDelete(order._id);
      } catch (deleteError) {
        logger.error('Error deleting order after upload failure:', deleteError);
      }

      // Preserve the original error message if it's informative
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      // Check for Cloudinary configuration errors
      if (error.message?.includes('cloud_name') || error.message?.includes('api_key') || error.message?.includes('api_secret')) {
        throw new BadRequestError('Cloudinary configuration error. Please check your environment variables.');
      }

      // Provide more informative error message
      throw new BadRequestError(
        error.message || 'Failed to upload images. Please check your Cloudinary configuration and try again.'
      );
    }

    logger.info(`Order created: ${order._id} by user ${userId}`);

    return order;
  }

  // get user's orders
  async getUserOrders(userId: string): Promise<IOrder[]> {
    return Order.find({ user: userId })
      .populate('plan', 'name price max_images')
      .populate('images', 'url')
      .populate({
        path: 'submissions',
        select: 'zip_url version createdAt',
        options: { sort: { version: -1 } },
      })
      .sort({ createdAt: -1 });
  }

  // get single order (user can only see their own)
  async getOrderById(orderId: string, userId?: string): Promise<IOrder | null> {
    const query: any = { _id: orderId };
    if (userId) {
      query.user = userId;
    }

    return Order.findOne(query)
      .populate('plan', 'name price max_images')
      .populate('images', 'url')
      .populate({
        path: 'submissions',
        select: 'zip_url version createdAt',
        options: { sort: { version: -1 } },
      })
      .populate('user', 'name email');
  }

  // get all orders (admin only)
  async getAllOrders(): Promise<IOrder[]> {
    return Order.find()
      .populate('plan', 'name price max_images')
      .populate('images', 'url')
      .populate({
        path: 'submissions',
        select: 'zip_url version createdAt',
        options: { sort: { version: -1 } },
      })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }

  // update order status (admin only)
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder | null> {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    )
      .populate('plan', 'name price max_images')
      .populate('images', 'url')
      .populate({
        path: 'submissions',
        select: 'zip_url version createdAt',
        options: { sort: { version: -1 } },
      })
      .populate('user', 'name email');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    logger.info(`Order ${orderId} status updated to ${status}`);
    return order;
  }

  // upload ZIP submission (admin only)
  async uploadSubmission(
    orderId: string,
    file: Express.Multer.File
  ): Promise<IOrderSubmission> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Get current submission count to determine version
    const submissionCount = await OrderSubmission.countDocuments({ orderId });
    const version = submissionCount + 1;

    // Upload ZIP to Cloudinary
    const uploadResult = await uploadToCloudinary(file, 'orders/submissions');

    // Create submission
    const submission = new OrderSubmission({
      orderId: new mongoose.Types.ObjectId(orderId),
      zip_url: uploadResult.url,
      zip_public_id: uploadResult.public_id,
      version,
    });

    await submission.save();

    // Add submission to order
    order.submissions.push(submission._id as mongoose.Types.ObjectId);
    await order.save();

    logger.info(`Submission uploaded for order ${orderId}, version ${version}`);
    return submission;
  }
}

export const orderService = new OrderService();

