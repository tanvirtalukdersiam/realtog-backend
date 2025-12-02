import type { Request, Response, NextFunction, Express } from "express";
import { messageService } from "./message.service.js";
import { sendSuccess } from "@utils/response.js";
import { SUCCESS_MESSAGES } from "@constants/index.js";
import type { AuthRequest } from "@middlewares/auth.middleware.js";

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: User-Admin messaging system endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Chat ID
 *         userId:
 *           type: string
 *           description: User ID
 *         userName:
 *           type: string
 *           description: User's name
 *         userEmail:
 *           type: string
 *           description: User's email
 *         initials:
 *           type: string
 *           description: User's initials
 *         lastMessage:
 *           type: string
 *           description: Last message content
 *         lastMessageTime:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last message
 *         unreadCount:
 *           type: integer
 *           description: Number of unread messages
 *         online:
 *           type: boolean
 *           description: User online status
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Message ID
 *         chatId:
 *           type: string
 *           description: Chat ID
 *         senderId:
 *           type: string
 *           description: Sender's user ID
 *         senderName:
 *           type: string
 *           description: Sender's name
 *         senderType:
 *           type: string
 *           enum: [user, admin]
 *           description: Type of sender
 *         content:
 *           type: string
 *           description: Message content
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Message timestamp
 *         read:
 *           type: boolean
 *           description: Whether message has been read
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs
 *     UserSearchResult:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           description: User's email
 *         role:
 *           type: string
 *           description: User's role
 *         initials:
 *           type: string
 *           description: User's initials
 *         online:
 *           type: boolean
 *           description: User online status
 *         lastSeen:
 *           type: string
 *           format: date-time
 *           description: Last seen timestamp
 */

class MessageController {
  // ==================== USER-ADMIN CHAT CONTROLLERS ====================

  /**
   * @swagger
   * /messages/user-admin/chat:
   *   get:
   *     summary: Get user's conversation with admin
   *     description: Retrieves the chat summary for the authenticated user's conversation with admin
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Chat retrieved successfully
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
   *                   example: Conversation retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/ChatSummary'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Chat not found
   */
  async getUserAdminChat(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const chat = await messageService.getUserAdminChat(req.user!.userId);
      sendSuccess(res, SUCCESS_MESSAGES.CONVERSATION_RETRIEVED, chat);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/messages:
   *   get:
   *     summary: Get messages in user's conversation with admin
   *     description: Retrieves all messages in the authenticated user's conversation with admin (up to 200 messages)
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
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
   *                   example: Conversation retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized
   */
  async getUserAdminMessages(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const messages = await messageService.getUserAdminMessages(
        req.user!.userId
      );
      sendSuccess(res, SUCCESS_MESSAGES.CONVERSATION_RETRIEVED, messages);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/messages:
   *   post:
   *     summary: Send message to admin
   *     description: Send a message from user to admin. Supports text and up to 5 images.
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               message:
   *                 type: string
   *                 description: Message content (required if no images)
   *                 example: Hello admin, I need help!
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: Image attachments (max 5)
   *     responses:
   *       201:
   *         description: Message sent successfully
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
   *                   example: Message sent successfully
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       400:
   *         description: Validation error (empty message, too many images)
   *       401:
   *         description: Unauthorized
   */
  async sendUserMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const message = await messageService.sendUserMessage(
        req.user!.userId,
        req.body,
        files
      );
      sendSuccess(res, SUCCESS_MESSAGES.MESSAGE_SENT, message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/chats:
   *   get:
   *     summary: Get all user-admin chats (Admin only)
   *     description: Retrieves all user-admin conversations. Only accessible by admin/moderator.
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Chats retrieved successfully
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
   *                   example: Conversations retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/ChatSummary'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   */
  async getAllUserAdminChats(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const chats = await messageService.getAllUserAdminChats();
      sendSuccess(res, SUCCESS_MESSAGES.CONVERSATIONS_RETRIEVED, chats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/chats/{id}:
   *   get:
   *     summary: Get specific user-admin chat (Admin only)
   *     description: Retrieves a specific user-admin conversation by chat ID
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Chat ID
   *     responses:
   *       200:
   *         description: Chat retrieved successfully
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
   *                   example: Conversation retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/ChatSummary'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: Chat not found
   */
  async getUserAdminChatById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const chat = await messageService.getUserAdminChatById(req.params.id);
      sendSuccess(res, SUCCESS_MESSAGES.CONVERSATION_RETRIEVED, chat);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/chats/{id}/messages:
   *   get:
   *     summary: Get messages in a specific chat (Admin only)
   *     description: Retrieves all messages in a specific user-admin conversation (up to 200 messages)
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Chat ID
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
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
   *                   example: Conversation retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: Chat not found
   */
  async getAdminUserMessages(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const messages = await messageService.getAdminUserMessages(
        req.params.id,
        req.user!.userId
      );
      sendSuccess(res, SUCCESS_MESSAGES.CONVERSATION_RETRIEVED, messages);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/chats/{id}/messages:
   *   post:
   *     summary: Send message to user (Admin only)
   *     description: Send a message from admin to a specific user. Supports text and up to 5 images.
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Chat ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               message:
   *                 type: string
   *                 description: Message content (required if no images)
   *                 example: Hello! How can I help you?
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: Image attachments (max 5)
   *     responses:
   *       201:
   *         description: Message sent successfully
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
   *                   example: Message sent successfully
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       400:
   *         description: Validation error (empty message, too many images)
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: Chat not found
   */
  async sendAdminMessage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const message = await messageService.sendAdminMessage(
        req.params.id,
        req.user!.userId,
        req.body,
        files
      );
      sendSuccess(res, SUCCESS_MESSAGES.MESSAGE_SENT, message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/chats:
   *   post:
   *     summary: Create new chat with user (Admin only)
   *     description: Creates a new user-admin conversation. If chat already exists, returns existing chat.
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user to start chat with
   *                 example: 507f1f77bcf86cd799439011
   *     responses:
   *       201:
   *         description: Chat created successfully
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
   *                   example: Conversation retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/ChatSummary'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: User not found
   */
  async createUserAdminChat(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const chat = await messageService.createUserAdminChat(
        req.user!.userId,
        req.body
      );
      sendSuccess(res, SUCCESS_MESSAGES.CONVERSATION_RETRIEVED, chat, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/users:
   *   get:
   *     summary: Get available users for chat (Admin only)
   *     description: Retrieves list of users that admin can start a chat with. Excludes other admins.
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search query to filter users by name or email
   *         example: john
   *     responses:
   *       200:
   *         description: Users retrieved successfully
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
   *                   example: Users retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/UserSearchResult'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   */
  async getAvailableUsersForChat(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await messageService.getAvailableUsersForChat(
        req.query.search as string | undefined
      );
      sendSuccess(res, SUCCESS_MESSAGES.USERS_RETRIEVED, users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /messages/user-admin/chat/{id}/read:
   *   post:
   *     summary: Mark chat as read
   *     description: Marks all messages in a chat as read for the current user. Updates unread count.
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Chat ID
   *     responses:
   *       200:
   *         description: Chat marked as read successfully
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
   *                   example: Message sent successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: ok
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Chat not found
   */
  /**
   * @swagger
   * /messages/user-admin/chats/{id}/read:
   *   post:
   *     summary: Mark chat as read (Admin)
   *     description: Marks all messages in a chat as read for admin. Updates admin unread count.
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Chat ID
   *     responses:
   *       200:
   *         description: Chat marked as read successfully
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
   *                   example: Message sent successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: ok
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: Chat not found
   */
  async markUserAdminChatAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const isAdmin =
        req.user!.role === "admin" || req.user!.role === "moderator";
      await messageService.markUserAdminChatAsRead(
        req.params.id,
        req.user!.userId,
        isAdmin
      );
      sendSuccess(res, SUCCESS_MESSAGES.MESSAGE_SENT, { status: "ok" });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
