import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { googleAuthService } from "./googleAuth.service.js";
import { sendSuccess } from "@utils/response.js";
import { SUCCESS_MESSAGES } from "@constants/index.js";
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./auth.types.js";
import { BadRequestError } from "@src/utils/apiError.js";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
export class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - phone
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *                 example: John Doe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               phone:
   *                 type: string
   *                 example: "+1234567890"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: password123
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Validation error
   *       409:
   *         description: User already exists
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData: RegisterDto = req.body;
      const result = await authService.register(userData);
      sendSuccess(res, SUCCESS_MESSAGES.USER_REGISTERED, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - emailOrPhone
   *               - password
   *             properties:
   *               emailOrPhone:
   *                 type: string
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: password123
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       401:
   *         description: Invalid credentials
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loginData: LoginDto = req.body;
      const result = await authService.login(loginData);
      sendSuccess(res, SUCCESS_MESSAGES.USER_LOGGED_IN, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const user = await authService.getMe(userId);
      sendSuccess(res, SUCCESS_MESSAGES.USER_RETRIEVED, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/google:
   *   get:
   *     summary: Initiate Google OAuth login
   *     tags: [Auth]
   *     description: Redirects to Google OAuth consent screen
   *     responses:
   *       302:
   *         description: Redirects to Google OAuth
   */
  /**
   * @swagger
   * /auth/google/callback:
   *   get:
   *     summary: Google OAuth callback
   *     tags: [Auth]
   *     description: Callback URL for Google OAuth. Redirects to frontend with JWT token.
   *     responses:
   *       302:
   *         description: Redirects to frontend with token
   *       401:
   *         description: Google authentication failed
   */
  async googleCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(
          `${frontendURL}/auth/google/failure?error=authentication_failed`
        );
      }

      const authResponse = await googleAuthService.generateAuthResponse(user);

      // redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectURL = `${frontendURL}/auth/google/success?token=${
        authResponse.token
      }&user=${encodeURIComponent(JSON.stringify(authResponse.user))}`;
      res.redirect(redirectURL);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/google/success:
   *   get:
   *     summary: Google OAuth success
   *     tags: [Auth]
   *     description: Returns the authentication token and user data from query parameters
   *     parameters:
   *       - in: query
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: JWT token
   *       - in: query
   *         name: user
   *         required: true
   *         schema:
   *           type: string
   *         description: URL-encoded JSON user object
   *     responses:
   *       200:
   *         description: Authentication successful
   *       400:
   *         description: Missing token or user data
   */
  async googleSuccess(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, user } = req.query;

      if (!token || !user) {
        throw new BadRequestError("Missing token or user data");
      }

      let userData;
      try {
        userData =
          typeof user === "string"
            ? JSON.parse(decodeURIComponent(user))
            : user;
      } catch (error) {
        throw new BadRequestError("Invalid user data format");
      }

      sendSuccess(res, SUCCESS_MESSAGES.USER_LOGGED_IN, {
        token: token as string,
        user: userData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/google/failure:
   *   get:
   *     summary: Google OAuth failure
   *     tags: [Auth]
   *     responses:
   *       401:
   *         description: Google authentication failed
   */
  async googleFailure(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(401).json({
        success: false,
        message: "Google authentication failed",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/forgot-password:
   *   post:
   *     summary: Request password reset OTP
   *     description: Sends an OTP to the user's email for password reset. Returns success even if email doesn't exist (security measure).
   *     tags: [Auth]
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
   *         description: Password reset OTP sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: If your email is registered, you will receive a password reset OTP
   *                 data:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                       example: john@example.com
   *       400:
   *         description: Validation error
   */
  async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: ForgotPasswordDto = req.body;
      await authService.requestPasswordReset(data);
      sendSuccess(
        res,
        "If your email is registered, you will receive a password reset OTP",
        {
          email: data.email,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/reset-password:
   *   post:
   *     summary: Reset password with OTP
   *     description: Resets user password after verifying OTP. Requires email, OTP code, and new password.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - otp
   *               - newPassword
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               otp:
   *                 type: string
   *                 example: "123456"
   *                 description: 6-digit OTP code received via email
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 example: NewSecurePass123!
   *                 description: Must be at least 8 characters with uppercase, lowercase, number, and special character
   *     responses:
   *       200:
   *         description: Password reset successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Password reset successfully. You can now login with your new password.
   *                 data:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                       example: john@example.com
   *       400:
   *         description: Invalid or expired OTP / Password validation failed
   *       401:
   *         description: Invalid email or OTP
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: ResetPasswordDto = req.body;
      await authService.resetPassword(data);
      sendSuccess(
        res,
        "Password reset successfully. You can now login with your new password.",
        {
          email: data.email,
        }
      );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
