import {
  UserAdminChat,
  UserAdminMessage,
  IUserAdminChat,
  IUserAdminMessage,
  IChatAttachment,
} from "./message.model.js";
import {
  UserAdminChatSummary,
  UserAdminMessageResponse,
  SendUserAdminMessageDto,
  CreateUserAdminChatDto,
} from "./message.types.js";
import { BadRequestError, NotFoundError } from "@utils/apiError.js";
import { getSocket } from "@socket/socket.js";
import logger from "@utils/logger.js";
import { User } from "@modules/user/user.model.js";
import { presenceService } from "./presence.service.js";
import { uploadToCloudinary } from "@utils/cloudinary.js";
import { Types } from "mongoose";
import type { Express } from "express";

const emitSocketEvent = (event: string, payload: unknown, room?: string) => {
  try {
    const io = getSocket();
    if (room) {
      io.to(room).emit(event, payload);
    } else {
      io.emit(event, payload);
    }
    logger.info(
      `[Socket] Emitted event '${event}' to ${room ? `room '${room}'` : "all"}`
    );
  } catch (error) {
    logger.warn("Socket emission skipped:", error);
  }
};

const buildInitials = (name?: string): string => {
  if (!name) return "NA";
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const toIdString = (
  value: Types.ObjectId | string | { _id: Types.ObjectId }
): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if ("_id" in value && value._id instanceof Types.ObjectId) {
    return value._id.toString();
  }
  return value.toString();
};

const summarizeAttachmentMessage = (count: number): string => {
  if (count <= 0) return "";
  return count === 1 ? "Sent an image" : `Sent ${count} images`;
};

class MessageService {
  private toUserAdminMessageResponse(
    message: IUserAdminMessage & {
      sender: { _id: Types.ObjectId; name: string };
    },
    currentUserId: string
  ): UserAdminMessageResponse {
    return {
      id: toIdString(message._id as Types.ObjectId),
      chatId: toIdString(message.chat),
      senderId: toIdString(message.sender),
      senderName: message.sender?.name ?? "Unknown",
      senderType: message.senderType,
      content: message.content,
      timestamp: message.createdAt,
      read: message.readBy.some(
        (reader) => toIdString(reader) === currentUserId
      ),
      images: message.attachments.map((attachment) => attachment.url),
    };
  }

  private async toUserAdminChatSummary(
    chat: IUserAdminChat,
    currentUserId: string,
    isAdmin: boolean
  ): Promise<UserAdminChatSummary> {
    const populatedChat = await chat.populate({
      path: "user",
      select: "name email role",
    });

    const userDoc = populatedChat.user as unknown as {
      _id: Types.ObjectId;
      name: string;
      email: string;
      role: string;
    };

    const userId = toIdString(userDoc._id);
    const presenceMap = await presenceService.getPresenceMap([userDoc._id]);
    const presence = presenceMap[userId];

    return {
      id: toIdString(chat._id as Types.ObjectId),
      userId,
      userName: userDoc.name,
      userEmail: userDoc.email,
      initials: buildInitials(userDoc.name),
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageAt,
      unreadCount: isAdmin ? chat.adminUnreadCount : chat.userUnreadCount,
      online: presence?.online ?? false,
    };
  }

  // User: Get their conversation with admin
  async getUserAdminChat(userId: string): Promise<UserAdminChatSummary | null> {
    const chat = await UserAdminChat.findOne({ user: userId }).populate({
      path: "user",
      select: "name email role",
    });

    if (!chat) {
      return null;
    }

    return this.toUserAdminChatSummary(chat, userId, false);
  }

  // User: Get messages in their conversation with admin
  async getUserAdminMessages(
    userId: string
  ): Promise<UserAdminMessageResponse[]> {
    const chat = await UserAdminChat.findOne({ user: userId });

    if (!chat) {
      return [];
    }

    const messages = await UserAdminMessage.find({ chat: chat._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate({ path: "sender", select: "name" })
      .lean();

    return messages.map((message) => {
      const hydratedMessage = message as unknown as IUserAdminMessage & {
        sender: { _id: Types.ObjectId; name: string };
      };
      return this.toUserAdminMessageResponse(hydratedMessage, userId);
    });
  }

  // User: Send message to admin
  async sendUserMessage(
    userId: string,
    payload: SendUserAdminMessageDto,
    files: Express.Multer.File[] = []
  ): Promise<UserAdminMessageResponse> {
    let chat = await UserAdminChat.findOne({ user: userId });

    if (!chat) {
      // Create chat if it doesn't exist
      chat = await UserAdminChat.create({
        user: userId,
        userUnreadCount: 0,
        adminUnreadCount: 0,
      });
    }

    if (!payload.message?.trim() && files.length === 0) {
      throw new BadRequestError("Message cannot be empty");
    }

    if (files.length > 5) {
      throw new BadRequestError("You can upload up to 5 images");
    }

    const attachments: IChatAttachment[] = [];
    for (const file of files) {
      const upload = await uploadToCloudinary(file, "messages");
      attachments.push({
        url: upload.url,
        publicId: upload.public_id,
        type: "image" as const,
      });
    }

    const message = await UserAdminMessage.create({
      chat: chat._id,
      sender: userId,
      senderType: "user",
      content: payload.message?.trim() ?? "",
      attachments,
      readBy: [new Types.ObjectId(userId)],
    });

    const normalizedText =
      payload.message?.trim() || summarizeAttachmentMessage(attachments.length);

    chat.lastMessage = normalizedText;
    chat.lastMessageAt = message.createdAt;
    chat.lastMessageSender = new Types.ObjectId(userId);
    chat.adminUnreadCount = (chat.adminUnreadCount ?? 0) + 1;
    await chat.save();

    const populatedMessage = await message.populate({
      path: "sender",
      select: "name",
    });

    const messageObject = populatedMessage.toObject<
      IUserAdminMessage & { sender: { _id: Types.ObjectId; name: string } }
    >();

    const response = this.toUserAdminMessageResponse(messageObject, userId);

    // Emit socket event
    emitSocketEvent(
      "user-admin:new-message",
      response,
      `user-admin:${chat._id}`
    );
    emitSocketEvent(
      "user-admin:chat-updated",
      await this.toUserAdminChatSummary(chat, userId, false),
      `user:${userId}`
    );
    emitSocketEvent(
      "user-admin:chat-updated",
      await this.toUserAdminChatSummary(chat, userId, true),
      "admins"
    );

    return response;
  }

  // Admin: Get all conversations with users
  async getAllUserAdminChats(): Promise<UserAdminChatSummary[]> {
    const chats = await UserAdminChat.find()
      .sort({ updatedAt: -1 })
      .limit(100)
      .populate({
        path: "user",
        select: "name email role",
      });

    const summaries = await Promise.all(
      chats.map(async (chat) => {
        const userDoc = chat.user as unknown as {
          _id: Types.ObjectId;
          name: string;
          email: string;
        };
        return this.toUserAdminChatSummary(chat, toIdString(userDoc._id), true);
      })
    );

    return summaries;
  }

  // Admin: Get specific conversation with user
  async getUserAdminChatById(chatId: string): Promise<UserAdminChatSummary> {
    const chat = await UserAdminChat.findById(chatId).populate({
      path: "user",
      select: "name email role",
    });

    if (!chat) {
      throw new NotFoundError("Chat not found");
    }

    const userDoc = chat.user as unknown as {
      _id: Types.ObjectId;
      name: string;
      email: string;
    };

    return this.toUserAdminChatSummary(chat, toIdString(userDoc._id), true);
  }

  // Admin: Get messages in a conversation
  async getAdminUserMessages(
    chatId: string,
    adminId: string
  ): Promise<UserAdminMessageResponse[]> {
    const chat = await UserAdminChat.findById(chatId);

    if (!chat) {
      throw new NotFoundError("Chat not found");
    }

    const messages = await UserAdminMessage.find({ chat: chat._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate({ path: "sender", select: "name" })
      .lean();

    return messages.map((message) => {
      const hydratedMessage = message as unknown as IUserAdminMessage & {
        sender: { _id: Types.ObjectId; name: string };
      };
      return this.toUserAdminMessageResponse(hydratedMessage, adminId);
    });
  }

  // Admin: Send message to user
  async sendAdminMessage(
    chatId: string,
    adminId: string,
    payload: SendUserAdminMessageDto,
    files: Express.Multer.File[] = []
  ): Promise<UserAdminMessageResponse> {
    const chat = await UserAdminChat.findById(chatId).populate({
      path: "user",
      select: "name email",
    });

    if (!chat) {
      throw new NotFoundError("Chat not found");
    }

    if (!payload.message?.trim() && files.length === 0) {
      throw new BadRequestError("Message cannot be empty");
    }

    if (files.length > 5) {
      throw new BadRequestError("You can upload up to 5 images");
    }

    const attachments: IChatAttachment[] = [];
    for (const file of files) {
      const upload = await uploadToCloudinary(file, "messages");
      attachments.push({
        url: upload.url,
        publicId: upload.public_id,
        type: "image" as const,
      });
    }

    const message = await UserAdminMessage.create({
      chat: chat._id,
      sender: adminId,
      senderType: "admin",
      content: payload.message?.trim() ?? "",
      attachments,
      readBy: [new Types.ObjectId(adminId)],
    });

    const normalizedText =
      payload.message?.trim() || summarizeAttachmentMessage(attachments.length);

    chat.lastMessage = normalizedText;
    chat.lastMessageAt = message.createdAt;
    chat.lastMessageSender = new Types.ObjectId(adminId);
    chat.userUnreadCount = (chat.userUnreadCount ?? 0) + 1;
    await chat.save();

    const populatedMessage = await message.populate({
      path: "sender",
      select: "name",
    });

    const messageObject = populatedMessage.toObject<
      IUserAdminMessage & { sender: { _id: Types.ObjectId; name: string } }
    >();

    const userDoc = chat.user as unknown as {
      _id: Types.ObjectId;
    };
    const userId = toIdString(userDoc._id);

    const response = this.toUserAdminMessageResponse(messageObject, adminId);

    // Emit socket events
    emitSocketEvent(
      "user-admin:new-message",
      response,
      `user-admin:${chat._id}`
    );
    emitSocketEvent(
      "user-admin:chat-updated",
      await this.toUserAdminChatSummary(chat, userId, false),
      `user:${userId}`
    );
    emitSocketEvent(
      "user-admin:chat-updated",
      await this.toUserAdminChatSummary(chat, userId, true),
      "admins"
    );

    return response;
  }

  // Admin: Create conversation with user (if doesn't exist)
  async createUserAdminChat(
    adminId: string,
    payload: CreateUserAdminChatDto
  ): Promise<UserAdminChatSummary> {
    const user = await User.findById(payload.userId).select("name email role");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    let chat = await UserAdminChat.findOne({ user: payload.userId });

    if (!chat) {
      chat = await UserAdminChat.create({
        user: payload.userId,
        userUnreadCount: 0,
        adminUnreadCount: 0,
        lastMessage: "Say hello 👋",
        lastMessageAt: new Date(),
        lastMessageSender: new Types.ObjectId(adminId),
      });
    }

    const summary = await this.toUserAdminChatSummary(
      chat,
      payload.userId,
      true
    );

    emitSocketEvent(
      "user-admin:chat-updated",
      summary,
      `user:${payload.userId}`
    );
    emitSocketEvent("user-admin:chat-updated", summary, "admins");

    return summary;
  }

  // Admin: Get list of users (for starting new chat)
  async getAvailableUsersForChat(search?: string) {
    const query: Record<string, unknown> = {
      role: { $ne: "admin" }, // Only non-admin users
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ name: 1 })
      .limit(50)
      .select("name role email");

    const presenceMap = await presenceService.getPresenceMap(
      users.map((user) => user._id as Types.ObjectId)
    );

    return users.map((user) => {
      const userId = toIdString(user._id as Types.ObjectId);
      const presence = presenceMap[userId];
      return {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: buildInitials(user.name),
        online: presence?.online ?? false,
        lastSeen: presence?.lastSeen,
      };
    });
  }

  // Mark chat as read
  async markUserAdminChatAsRead(
    chatId: string,
    userId: string,
    isAdmin: boolean
  ): Promise<void> {
    const chat = await UserAdminChat.findById(chatId);

    if (!chat) {
      throw new NotFoundError("Chat not found");
    }

    if (isAdmin) {
      chat.adminUnreadCount = 0;
    } else {
      chat.userUnreadCount = 0;
    }

    await chat.save();

    const currentUserObjectId = new Types.ObjectId(userId);

    await UserAdminMessage.updateMany(
      { chat: chatId, readBy: { $ne: currentUserObjectId } },
      { $addToSet: { readBy: currentUserObjectId } }
    );
  }
}

export const messageService = new MessageService();
export default messageService;
