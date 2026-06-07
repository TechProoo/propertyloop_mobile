import api from "../client";

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
}

const usersService = {
  getProfile(): Promise<any> {
    return api.get("/users/me").then((r) => r.data);
  },
  updateProfile(payload: UpdateProfilePayload): Promise<any> {
    return api.patch("/users/me", payload).then((r) => r.data);
  },
};

export default usersService;
