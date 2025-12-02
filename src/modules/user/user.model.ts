import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  emailVerified: boolean;
  googleId?: string;
  provider: "local" | "google";
  role: "admin" | "moderator" | "user";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      required: function (this: IUser) {
        return this.provider === "local";
      },
      unique: true,
      sparse: true, // allows multiple null values
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.provider === "local";
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // don't include password in queries by default
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      sparse: true, // allows multiple null values
      unique: true,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["admin", "moderator", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

// create indexes for faster queries
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });
// userSchema.index({ googleId: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
