import api from "../client";

export interface BlockedUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  blockedAt: string;
}

const blocksService = {
  list(): Promise<BlockedUser[]> {
    return api.get("/blocks").then((r) => r.data);
  },
  block(userId: string, reason?: string): Promise<{ success: boolean }> {
    return api.post("/blocks", { userId, reason }).then((r) => r.data);
  },
  unblock(userId: string): Promise<{ success: boolean }> {
    return api.delete(`/blocks/${userId}`).then((r) => r.data);
  },
};

export default blocksService;
