import { UserPresence } from "./presence.model.js";
import type { IUserPresence } from "./presence.model.js";
import { Types } from "mongoose";

class PresenceService {
  async setOnline(userId: string | Types.ObjectId): Promise<IUserPresence> {
    return UserPresence.findOneAndUpdate(
      { user: userId },
      { online: true, lastSeen: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async setOffline(userId: string | Types.ObjectId): Promise<IUserPresence | null> {
    return UserPresence.findOneAndUpdate(
      { user: userId },
      { online: false, lastSeen: new Date() },
      { new: true }
    );
  }

  async getPresenceMap(
    userIds: Array<string | Types.ObjectId>
  ): Promise<Record<string, { online: boolean; lastSeen?: Date }>> {
    if (!userIds.length) {
      return {};
    }

    const presenceDocs = await UserPresence.find({
      user: { $in: userIds },
    });

    return presenceDocs.reduce<Record<string, { online: boolean; lastSeen?: Date }>>(
      (acc, doc) => {
        acc[doc.user.toString()] = {
          online: doc.online,
          lastSeen: doc.lastSeen,
        };
        return acc;
      },
      {}
    );
  }
}

export const presenceService = new PresenceService();

