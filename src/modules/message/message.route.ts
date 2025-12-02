import { Router } from "express";
import type { RequestHandler } from "express";
import { messageController } from "./message.controller.js";
import { validateRequest } from "@middlewares/validation.middleware.js";
import {
  sendUserAdminMessageSchema,
  createUserAdminChatSchema,
} from "./message.validation.js";
import {
  authMiddleware,
  authorizeRoles,
} from "@middlewares/auth.middleware.js";
import { uploadImages } from "@middlewares/upload.middleware.js";

const bindController = (
  handler: (req: any, res: any, next: any) => Promise<void>
): RequestHandler =>
  handler.bind(messageController) as unknown as RequestHandler;

const router: Router = Router();

// ==================== USER-ADMIN CHAT ROUTES ====================

// User routes (authenticated users)
router.get(
  "/user-admin/chat",
  authMiddleware,
  bindController(messageController.getUserAdminChat)
);

router.get(
  "/user-admin/messages",
  authMiddleware,
  bindController(messageController.getUserAdminMessages)
);

router.post(
  "/user-admin/messages",
  authMiddleware,
  uploadImages.array("images", 5),
  validateRequest(sendUserAdminMessageSchema),
  bindController(messageController.sendUserMessage)
);

router.post(
  "/user-admin/chat/:id/read",
  authMiddleware,
  bindController(messageController.markUserAdminChatAsRead)
);

// Admin routes (admin/moderator only)
router.get(
  "/user-admin/chats",
  authMiddleware,
  authorizeRoles("admin", "moderator"),
  bindController(messageController.getAllUserAdminChats)
);

router.get(
  "/user-admin/chats/:id",
  authMiddleware,
  authorizeRoles("admin", "moderator"),
  bindController(messageController.getUserAdminChatById)
);

router.get(
  "/user-admin/chats/:id/messages",
  authMiddleware,
  authorizeRoles("admin", "moderator"),
  bindController(messageController.getAdminUserMessages)
);

router.post(
  "/user-admin/chats/:id/messages",
  authMiddleware,
  authorizeRoles("admin", "moderator"),
  uploadImages.array("images", 5),
  validateRequest(sendUserAdminMessageSchema),
  bindController(messageController.sendAdminMessage)
);

router.post(
  "/user-admin/chats",
  authMiddleware,
  authorizeRoles("admin", "moderator"),
  validateRequest(createUserAdminChatSchema),
  bindController(messageController.createUserAdminChat)
);

router.get(
  "/user-admin/users",
  authMiddleware,
  authorizeRoles("admin", "moderator"),
  bindController(messageController.getAvailableUsersForChat)
);

router.post(
  "/user-admin/chats/:id/read",
  authMiddleware,
  authorizeRoles("admin", "moderator"),
  bindController(messageController.markUserAdminChatAsRead)
);

export default router;
