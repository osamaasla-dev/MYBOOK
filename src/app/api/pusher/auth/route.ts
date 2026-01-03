import { NextResponse } from "next/server";

import { pusherServer } from "@/lib/pusher/server";
import { logger } from "@/lib/logger";
import { getRequestLog } from "@/lib/request-log";
import { validateSession } from "@/features/services/server";

type PusherAuthPayload = {
  socket_id?: string;
  channel_name?: string;
};

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 }
);
const ROUTE = "api/pusher/auth";

export async function POST(request: Request) {
  const { requestId, log } = await getRequestLog({ route: ROUTE });

  try {
    const session = await validateSession(log, requestId);
    if (!session.ok) return session.response;
    const viewer = session?.user;

    const body = (await request.json()) as PusherAuthPayload;
    const socketId = body.socket_id;
    const channelName = body.channel_name;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    if (!channelName.startsWith("private-user-")) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 403 });
    }

    const channelOwnerId = channelName.replace("private-user-", "");
    if (channelOwnerId !== viewer.id) {
      return UNAUTHORIZED;
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    logger.error({ error }, "Pusher auth failed");
    return NextResponse.json({ error: "Pusher auth failed" }, { status: 500 });
  }
}
