import { Request, Response, NextFunction } from 'express';
import { otpService } from './otp.service.js';
import { userService } from '../user/user.service.js';
import { sendSuccess } from '@utils/response.js';
import type { SendOTPDto, VerifyOTPDto, ResendOTPDto } from './otp.types.js';

/**
 * @swagger
 * tags:
 *   name: OTP
 *   description: OTP verification endpoints
 */
export class OTPController {
  /**
   * @swagger
   * /otp/send:
   *   post:
   *     summary: Send OTP to email
   *     tags: [OTP]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *     responses:
   *       200:
   *         description: OTP sent successfully
   *       404:
   *         description: User not found
   */
  async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email }: SendOTPDto = req.body;
      await otpService.sendOTP(email);
      sendSuccess(res, 'OTP sent successfully to your email', { email });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /otp/verify:
   *   post:
   *     summary: Verify OTP code
   *     tags: [OTP]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - code
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               code:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: OTP verified successfully
   *       400:
   *         description: Invalid or expired OTP
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code }: VerifyOTPDto = req.body;
      await otpService.verifyOTP(email, code);
      
      // update user emailVerified status
      const user = await userService.findByEmail(email);
      if (user) {
        user.emailVerified = true;
        await user.save();
      }

      sendSuccess(res, 'Email verified successfully', {
        email,
        verified: true,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /otp/resend:
   *   post:
   *     summary: Resend OTP to email
   *     tags: [OTP]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *     responses:
   *       200:
   *         description: OTP resent successfully
   *       400:
   *         description: Please wait before requesting a new OTP
   *       404:
   *         description: User not found
   */
  async resendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email }: ResendOTPDto = req.body;
      await otpService.resendOTP(email);
      sendSuccess(res, 'OTP resent successfully to your email', { email });
    } catch (error) {
      next(error);
    }
  }
}

export const otpController = new OTPController();

