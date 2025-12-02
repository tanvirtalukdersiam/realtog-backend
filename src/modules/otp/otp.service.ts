import { OTP, IOTP } from './otp.model.js';
import { sendOTPEmail } from '@utils/email.service.js';
import { config } from '@config/index.js';
import { BadRequestError, NotFoundError } from '@utils/apiError.js';
import logger from '@utils/logger.js';
import { userService } from '../user/user.service.js';

export class OTPService {
  // generate random OTP code
  private generateOTPCode(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < config.otpLength; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  // send OTP to email
  async sendOTP(email: string, name?: string): Promise<void> {
    // check if user exists
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found with this email');
    }

    // invalidate previous unverified OTPs for this email
    await OTP.updateMany(
      { email: email.toLowerCase(), verified: false },
      { verified: true } // mark as verified to invalidate
    );

    // generate new OTP
    const otpCode = this.generateOTPCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpiryMinutes);

    // save OTP to database
    const otp = new OTP({
      email: email.toLowerCase(),
      code: otpCode,
      expiresAt,
      verified: false,
    });

    await otp.save();

    // send email
    try {
      await sendOTPEmail(email, otpCode, name || user.name);
      logger.info(`OTP sent to ${email}`);
    } catch (error: any) {
      logger.error(`Failed to send OTP to ${email}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }

  // verify OTP
  async verifyOTP(email: string, code: string): Promise<boolean> {
    const otp = await OTP.findOne({
      email: email.toLowerCase(),
      code,
      verified: false,
      expiresAt: { $gt: new Date() }, // not expired
    });

    if (!otp) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    // mark OTP as verified
    otp.verified = true;
    await otp.save();

    logger.info(`OTP verified for ${email}`);
    return true;
  }

  // resend OTP
  async resendOTP(email: string): Promise<void> {
    // check if user exists
    const user = await userService.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found with this email');
    }

    // check if there's a recent OTP request (prevent spam)
    const recentOTP = await OTP.findOne({
      email: email.toLowerCase(),
      createdAt: { $gte: new Date(Date.now() - 60000) }, // within last minute
      verified: false,
    });

    if (recentOTP) {
      throw new BadRequestError('Please wait a minute before requesting a new OTP');
    }

    // invalidate previous unverified OTPs for this email
    await OTP.updateMany(
      { email: email.toLowerCase(), verified: false },
      { verified: true } // mark as verified to invalidate
    );

    // generate new OTP
    const otpCode = this.generateOTPCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpiryMinutes);

    // save OTP to database
    const otp = new OTP({
      email: email.toLowerCase(),
      code: otpCode,
      expiresAt,
      verified: false,
    });

    await otp.save();

    // send email
    try {
      await sendOTPEmail(email, otpCode, user.name);
      logger.info(`OTP resent to ${email}`);
    } catch (error: any) {
      logger.error(`Failed to resend OTP to ${email}:`, error);
      throw new Error('Failed to send OTP email');
    }
  }

  // check if email is verified (has a verified OTP)
  async isEmailVerified(email: string): Promise<boolean> {
    const verifiedOTP = await OTP.findOne({
      email: email.toLowerCase(),
      verified: true,
    });

    return !!verifiedOTP;
  }

  // cleanup expired OTPs (optional, MongoDB TTL index handles this automatically)
  async cleanupExpiredOTPs(): Promise<void> {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    logger.info(`Cleaned up ${result.deletedCount} expired OTPs`);
  }
}

export const otpService = new OTPService();

