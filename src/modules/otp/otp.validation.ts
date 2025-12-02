import { z } from 'zod';

export const sendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    code: z.string().length(6, 'OTP code must be 6 digits').regex(/^\d+$/, 'OTP code must contain only digits'),
  }),
});

export const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
  }),
});

export type SendOTPValidation = z.infer<typeof sendOTPSchema>;
export type VerifyOTPValidation = z.infer<typeof verifyOTPSchema>;
export type ResendOTPValidation = z.infer<typeof resendOTPSchema>;

