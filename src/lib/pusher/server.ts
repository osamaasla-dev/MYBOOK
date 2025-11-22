import Pusher from "pusher";

function requireEnv(name: string, value?: string): string {
  if (!value) {
    throw new Error(
      `Missing Pusher environment variable: ${name}. Please set it in .env.local.`
    );
  }
  return value;
}

const appId = requireEnv("PUSHER_APP_ID", process.env.PUSHER_APP_ID);
const key = requireEnv("PUSHER_KEY", process.env.PUSHER_KEY);
const secret = requireEnv("PUSHER_SECRET", process.env.PUSHER_SECRET);
const cluster = requireEnv("PUSHER_CLUSTER", process.env.PUSHER_CLUSTER);

declare global {
  var __pusherServer: Pusher | undefined;
}

function createPusherServer() {
  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
}

export const pusherServer = global.__pusherServer ?? createPusherServer();

if (process.env.NODE_ENV !== "production") {
  global.__pusherServer = pusherServer;
}

export type { Pusher as PusherServerInstance };
