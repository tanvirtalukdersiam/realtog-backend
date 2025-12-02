import mongoose, { Schema, Document } from "mongoose";

export interface IPricing extends Document {
  name: string;
  price: number;
  max_images: number;
  createdAt: Date;
  updatedAt: Date;
}

const pricingSchema = new Schema<IPricing>(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    max_images: {
      type: Number,
      required: [true, "Max images is required"],
      min: [1, "Max images must be at least 1"],
    },
  },
  {
    timestamps: true,
  }
);

export const Pricing = mongoose.model<IPricing>("Pricing", pricingSchema);

