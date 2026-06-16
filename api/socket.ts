import { io, type Socket } from "socket.io-client";
import { tokenStore } from "./tokenStore";

// Same origin as the REST API, minus the trailing /api path. The chat gateway
// lives on the `/chat` namespace and authenticates with the access token
// (handshake query `token`, see ChatGateway.extractToken).
const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://propertyloopbackend-production.up.railway.app/api";
const origin = baseURL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

/** Lazily create + connect the shared chat socket. */
export function getChatSocket(): Socket {
  if (socket) return socket;
  socket = io(`${origin}/chat`, {
    transports: ["websocket"],
    query: { token: tokenStore.getAccess() ?? "" },
    autoConnect: true,
    reconnection: true,
  });
  // Re-send the latest access token on every reconnect attempt.
  socket.io.on("reconnect_attempt", () => {
    if (socket) socket.io.opts.query = { token: tokenStore.getAccess() ?? "" };
  });
  return socket;
}

/** Tear down the socket (on sign-out). */
export function disconnectChatSocket() {
  socket?.disconnect();
  socket = null;
}
