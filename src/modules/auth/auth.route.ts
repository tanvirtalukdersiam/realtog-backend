import { Router } from "express";
import passport from "../../config/passport.config.js";
import { authController } from "./auth.controller.js";
import { validateRequest } from "@middlewares/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";
import { authMiddleware } from "@middlewares/auth.middleware.js";

const router: Router = Router();

// register route
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register.bind(authController)
);

// login route
router.post(
  "/login",
  validateRequest(loginSchema),
  authController.login.bind(authController)
);

// get current user route
router.get("/me", authMiddleware, authController.getMe.bind(authController));

// forgot password route
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  authController.requestPasswordReset.bind(authController)
);

// reset password route
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

// google oauth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  (req: any, res: any, next: any) => {
    passport.authenticate(
      "google",
      { session: false },
      (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          const frontendURL =
            process.env.FRONTEND_URL || "http://localhost:3000";
          return res.redirect(
            `${frontendURL}/auth/google/failure?error=authentication_failed`
          );
        }
        req.user = user;
        next();
      }
    )(req, res, next);
  },
  authController.googleCallback.bind(authController)
);

router.get(
  "/google/success",
  authController.googleSuccess.bind(authController)
);
router.get(
  "/google/failure",
  authController.googleFailure.bind(authController)
);

export default router;
