"use client";

import PusherClient, { type Authorizer, type Channel } from "pusher-js";

function requireEnv(name: string, value?: string): string {
  if (!value) {
    throw new Error(
      `Missing Pusher environment variable: ${name}. Please set it in .env.local.`
    );
  }
  return value;
}

const key = requireEnv(
  "NEXT_PUBLIC_PUSHER_KEY",
  process.env.NEXT_PUBLIC_PUSHER_KEY
);
const cluster = requireEnv(
  "NEXT_PUBLIC_PUSHER_CLUSTER",
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
);

let client: PusherClient | null = null;

const createAuthorizer =
  (endpoint: string) =>
  (channel: Channel): Authorizer => ({
    authorize: (socketId, callback) => {
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channel.name,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            callback(
              new Error(errorPayload.error || "Pusher auth failed"),
              null
            );
            return;
          }

          const data = await response.json();
          callback(null, data);
        })
        .catch((error: Error) => {
          callback(error, null);
        });
    },
  });

export function getPusherClient(): PusherClient {
  if (!client) {
    client = new PusherClient(key, {
      cluster,
      forceTLS: true,
      authorizer: (channel) => createAuthorizer("/api/pusher/auth")(channel),
    });

    // Avoid logging channel details to console to prevent leaking sensitive info.
    PusherClient.logToConsole = false;
  }

  return client;
}

export type { PusherClient };
