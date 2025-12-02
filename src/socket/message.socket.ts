import type { Server, Socket } from "socket.io";
import logger from "@utils/logger.js";
import { verifyToken } from "@utils/jwt.js";
import type { JWTPayload } from "@utils/jwt.js";
import { presenceService } from "@modules/message/presence.service.js";

const onlineUserCounts = new Map<string, number>();

const incrementPresence = async (userId: string) => {
  const nextCount = (onlineUserCounts.get(userId) ?? 0) + 1;
  onlineUserCounts.set(userId, nextCount);
  if (nextCount === 1) {
    await presenceService.setOnline(userId);
  }
};

const decrementPresence = async (userId: string) => {
  const currentCount = onlineUserCounts.get(userId) ?? 0;
  if (currentCount <= 1) {
    onlineUserCounts.delete(userId);
    await presenceService.setOffline(userId);
    return;
  }
  onlineUserCounts.set(userId, currentCount - 1);
};

export const registerMessageSocketHandlers = (io: Server): void => {
  // Authentication middleware
  io.use((socket, next) => {
    const authHeader = socket.handshake.auth?.token
      ? `Bearer ${socket.handshake.auth.token}`
      : socket.handshake.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    try {
      const payload = verifyToken(token);
      socket.data.user = payload;
      logger.debug(
        `Socket authenticated for user: ${payload.userId} (${payload.role})`
      );
    } catch (error) {
      logger.warn(
        `Socket authentication failed for socket ${socket.id}:`,
        error
      );
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;
    logger.info(
      `[Socket] New Connection: ${socket.id} | User: ${
        user ? `${user.userId} (${user.role})` : "Guest"
      }`
    );

    if (user) {
      // Join user-specific room for receiving updates
      socket.join(`user:${user.userId}`);

      // Update presence (online status)
      incrementPresence(user.userId).catch((error) => {
        logger.error("Failed to update presence", error);
      });
    }

    // Admin joins admin room to receive all chat updates
    socket.on("join-admin", () => {
      logger.debug(`[Socket] Received 'join-admin' event from ${socket.id}`);
      if (!user) {
        logger.warn(
          `[Socket] Unauthorized 'join-admin' attempt from ${socket.id}`
        );
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      // Check if user is admin or moderator
      if (user.role === "admin" || user.role === "moderator") {
        socket.join("admins");
        logger.info(
          `[Socket] Admin/Moderator ${user.userId} joined 'admins' room`
        );
      } else {
        logger.warn(
          `[Socket] Access denied for 'join-admin' from user ${user.userId} (role: ${user.role})`
        );
        socket.emit("error", {
          message: "Unauthorized: Admin access required",
        });
      }
    });

    // Join a specific user-admin chat room
    socket.on("user-admin:join", (chatId: string) => {
      if (!user) {
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      socket.join(`user-admin:${chatId}`);
      logger.debug(`Socket ${socket.id} joined user-admin chat:${chatId}`);
    });

    // Leave a specific user-admin chat room
    socket.on("user-admin:leave", (chatId: string) => {
      socket.leave(`user-admin:${chatId}`);
      logger.debug(`Socket ${socket.id} left user-admin chat:${chatId}`);
    });

    // Disconnect handler
    socket.on("disconnect", (reason) => {
      logger.info(
        `[Socket] Disconnected: ${socket.id} | Reason: ${reason} | User: ${
          user?.userId || "Guest"
        }`
      );
      if (user) {
        decrementPresence(user.userId).catch((error) => {
          logger.error("Failed to update presence on disconnect", error);
        });
      }
    });
  });
};
