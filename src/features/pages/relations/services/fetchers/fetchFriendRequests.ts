import { FriendRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { toUserSummary, userSummarySelect } from "../shared";
import type { BaseTabQueryArgs, TabRecord } from "../shared";

export async function fetchFriendRequests({
  userId,
  take,
  cursor,
}: BaseTabQueryArgs): Promise<TabRecord[]> {
  const rows = await prisma.friendRequest.findMany({
    where: { receiverId: userId, status: FriendRequestStatus.PENDING },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      status: true,
      requester: { select: userSummarySelect },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    tab: "friend-requests",
    createdAt: row.createdAt.toISOString(),
    user: toUserSummary(row.requester),
    status: row.status,
  }));
}
