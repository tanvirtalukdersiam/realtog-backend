import { Router } from 'express';
import { otpController } from './otp.controller.js';
import { validateRequest } from '@middlewares/validation.middleware.js';
import { sendOTPSchema, verifyOTPSchema, resendOTPSchema } from './otp.validation.js';

const router: Router = Router();

// send OTP route
router.post(
  '/send',
  validateRequest(sendOTPSchema),
  otpController.sendOTP.bind(otpController)
);

// verify OTP route
router.post(
  '/verify',
  validateRequest(verifyOTPSchema),
  otpController.verifyOTP.bind(otpController)
);

// resend OTP route
router.post(
  '/resend',
  validateRequest(resendOTPSchema),
  otpController.resendOTP.bind(otpController)
);

export default router;

