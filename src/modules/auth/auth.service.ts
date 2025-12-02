import bcrypt from "bcryptjs";
import { userService } from "../user/user.service.js";
import { generateToken } from "@utils/jwt.js";
import { UnauthorizedError } from "@utils/apiError.js";
import { ERROR_MESSAGES } from "@constants/index.js";
import { config } from "@config/index.js";
import logger from "@utils/logger.js";
import { otpService } from "../otp/otp.service.js";
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  MeResponse,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./auth.types.js";
import mongoose from "mongoose";

export class AuthService {
  // register user
  async register(userData: RegisterDto): Promise<AuthResponse> {
    // hash password
    const hashedPassword = await bcrypt.hash(
      userData.password,
      config.bcryptSaltRounds
    );

    // create user
    const user: any = await userService.createUser({
      ...userData,
      password: hashedPassword,
    });

    // generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    logger.info(`User registered: ${user.email}`);

    // send OTP for email verification (async, don't wait)
    otpService.sendOTP(user.email, user.name).catch((error) => {
      logger.error(`Failed to send OTP to ${user.email}:`, error);
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        role: user.role,
      },
      token,
    };
  }

  // login user
  async login(loginData: LoginDto): Promise<AuthResponse> {
    // find user by email or phone
    const user = await userService.findByEmailOrPhone(loginData.emailOrPhone);

    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // check if user is a Google user (no password)
    if (user.provider === "google") {
      throw new UnauthorizedError("Please use Google login for this account");
    }

    // verify password (only for local users)
    if (!user.password) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // generate token
    const token = generateToken({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        emailVerified: user.emailVerified,
        role: user.role,
      },
      token,
    };
  }

  // get current user
  async getMe(userId: string): Promise<MeResponse> {
    const user = await userService.findById(userId);

    if (!user) {
      throw new UnauthorizedError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      emailVerified: user.emailVerified,
      role: user.role,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // request password reset
  async requestPasswordReset(data: ForgotPasswordDto): Promise<void> {
    const { email } = data;

    // check if user exists
    const user = await userService.findByEmail(email);

    if (!user) {
      // For security, don't reveal if user exists or not
      // Just return success to prevent user enumeration
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Check if user is a Google user (no password)
    if (user.provider === "google") {
      logger.warn(`Password reset requested for Google user: ${email}`);
      // Still return success to prevent user enumeration
      return;
    }

    // Send OTP for password reset
    await otpService.sendOTP(email, user.name);

    logger.info(`Password reset OTP sent to: ${email}`);
  }

  // reset password
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    const { email, otp, newPassword } = data;

    // check if user exists
    const user = await userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or OTP");
    }

    // Check if user is a Google user (no password)
    if (user.provider === "google") {
      throw new UnauthorizedError("Cannot reset password for Google accounts");
    }

    // Verify OTP
    await otpService.verifyOTP(email, otp);

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      config.bcryptSaltRounds
    );

    // Update user password
    user.password = hashedPassword;
    await user.save();

    logger.info(`Password reset successful for: ${email}`);
  }
}

export const authService = new AuthService();
