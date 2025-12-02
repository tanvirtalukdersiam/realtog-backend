import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    phone: z.string().min(10, "Phone must be at least 10 characters").trim(),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrPhone: z.string().min(1, "Email or phone is required").trim(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
  }),
});

export type RegisterValidation = z.infer<typeof registerSchema>;
export type LoginValidation = z.infer<typeof loginSchema>;
export type ForgotPasswordValidation = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValidation = z.infer<typeof resetPasswordSchema>;
