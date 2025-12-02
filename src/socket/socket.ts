import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "@config/index.js";
import logger from "@utils/logger.js";
import { registerMessageSocketHandlers } from "@socket/message.socket.js";

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  registerMessageSocketHandlers(io);
  logger.info("Socket.io server initialized");
  return io;
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
