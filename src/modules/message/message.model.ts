import mongoose, { Schema, Document, Types } from "mongoose";

// ==================== USER-ADMIN CHAT MODELS ====================

export interface IChatAttachment {
  url: string;
  publicId: string;
  type: "image";
}

export interface IUserAdminChat extends Document {
  user: Types.ObjectId;
  userUnreadCount: number;
  adminUnreadCount: number;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSender?: Types.ObjectId; // user or admin
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAdminMessage extends Document {
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  senderType: "user" | "admin";
  content: string;
  attachments: IChatAttachment[];
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const chatAttachmentSchema = new Schema<IChatAttachment>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["image"],
      default: "image",
    },
  },
  { _id: false }
);

const userAdminChatSchema = new Schema<IUserAdminChat>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One chat per user
    },
    userUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessage: {
      type: String,
      trim: true,
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessageSender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

userAdminChatSchema.index({ user: 1 });
userAdminChatSchema.index({ updatedAt: -1 });

const userAdminMessageSchema = new Schema<IUserAdminMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "UserAdminChat",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: {
      type: [chatAttachmentSchema],
      default: [],
      validate: {
        validator(value: IChatAttachment[]) {
          return value.length <= 5;
        },
        message: "A maximum of 5 attachments is allowed",
      },
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userAdminMessageSchema.index({ chat: 1, createdAt: 1 });

export const UserAdminChat = mongoose.model<IUserAdminChat>(
  "UserAdminChat",
  userAdminChatSchema
);
export const UserAdminMessage = mongoose.model<IUserAdminMessage>(
  "UserAdminMessage",
  userAdminMessageSchema
);
