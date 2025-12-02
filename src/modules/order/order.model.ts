import mongoose, { Schema, Document, Types } from "mongoose";

export type OrderStatus = 'In Progress' | 'Delivered' | 'Revision' | 'Completed';

export interface IOrderImage extends Document {
  url: string;
  public_id: string;
  orderId: Types.ObjectId;
  createdAt: Date;
}

export interface IOrderSubmission extends Document {
  orderId: Types.ObjectId;
  zip_url: string;
  zip_public_id: string;
  version: number;
  createdAt: Date;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  status: OrderStatus;
  images: Types.ObjectId[];
  submissions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const orderImageSchema = new Schema<IOrderImage>(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const orderSubmissionSchema = new Schema<IOrderSubmission>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    zip_url: {
      type: String,
      required: true,
    },
    zip_public_id: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Pricing',
      required: true,
    },
    status: {
      type: String,
      enum: ['In Progress', 'Delivered', 'Revision', 'Completed'],
      default: 'In Progress',
    },
    images: [{
      type: Schema.Types.ObjectId,
      ref: 'OrderImage',
    }],
    submissions: [{
      type: Schema.Types.ObjectId,
      ref: 'OrderSubmission',
    }],
  },
  {
    timestamps: true,
  }
);

export const OrderImage = mongoose.model<IOrderImage>("OrderImage", orderImageSchema);
export const OrderSubmission = mongoose.model<IOrderSubmission>("OrderSubmission", orderSubmissionSchema);
export const Order = mongoose.model<IOrder>("Order", orderSchema);

