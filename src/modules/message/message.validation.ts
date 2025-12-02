import { z } from "zod";

// ==================== USER-ADMIN CHAT VALIDATION ====================

export const sendUserAdminMessageSchema = z.object({
  body: z.object({
    message: z.string().optional(),
  }),
});

export const createUserAdminChatSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User ID is required"),
  }),
});
