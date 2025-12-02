import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserPresence extends Document {
  user: Types.ObjectId;
  online: boolean;
  lastSeen: Date;
  updatedAt: Date;
  createdAt: Date;
}

const userPresenceSchema = new Schema<IUserPresence>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    online: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

userPresenceSchema.index({ user: 1 });
userPresenceSchema.index({ online: 1, updatedAt: -1 });

export const UserPresence = mongoose.model<IUserPresence>(
  "UserPresence",
  userPresenceSchema
);

