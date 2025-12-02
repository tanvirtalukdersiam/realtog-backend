import { Pricing, IPricing } from './pricing.model.js';
import { NotFoundError } from '@utils/apiError.js';
import logger from '@utils/logger.js';

export class PricingService {
  // get all pricing plans
  async getAllPlans(): Promise<IPricing[]> {
    return Pricing.find().sort({ price: 1 }); // sort by price ascending
  }

  // get pricing plan by id
  async getPlanById(planId: string): Promise<IPricing | null> {
    return Pricing.findById(planId);
  }

  // create pricing plan
  async createPlan(planData: { name: string; price: number; max_images: number }): Promise<IPricing> {
    const plan = new Pricing(planData);
    await plan.save();
    logger.info(`Pricing plan created: ${plan.name} - $${plan.price} - ${plan.max_images} images`);
    return plan;
  }

  // update pricing plan
  async updatePlan(planId: string, planData: { name?: string; price?: number; max_images?: number }): Promise<IPricing | null> {
    const plan = await Pricing.findByIdAndUpdate(
      planId,
      { ...planData },
      { new: true, runValidators: true }
    );

    if (!plan) {
      throw new NotFoundError('Pricing plan not found');
    }

    logger.info(`Pricing plan updated: ${plan.name} - $${plan.price}`);
    return plan;
  }

  // delete pricing plan
  async deletePlan(planId: string): Promise<boolean> {
    const plan = await Pricing.findByIdAndDelete(planId);

    if (!plan) {
      throw new NotFoundError('Pricing plan not found');
    }

    logger.info(`Pricing plan deleted: ${plan.name}`);
    return true;
  }
}

export const pricingService = new PricingService();

