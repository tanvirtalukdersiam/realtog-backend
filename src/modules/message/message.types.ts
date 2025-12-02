// ==================== USER-ADMIN CHAT TYPES ====================

export interface UserAdminChatSummary {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  initials: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  online?: boolean;
}

export interface UserAdminMessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: "user" | "admin";
  content: string;
  timestamp: Date;
  read: boolean;
  images: string[];
}

export interface SendUserAdminMessageDto {
  message?: string;
}

export interface CreateUserAdminChatDto {
  userId: string;
}
