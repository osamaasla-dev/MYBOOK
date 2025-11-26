import { FollowRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { BaseTabQueryArgs, TabRecord } from "../shared";
import { toUserSummary, userSummarySelect } from "../shared";

export async function fetchSentFollowRequests({
  userId,
  take,
  cursor,
}: BaseTabQueryArgs): Promise<TabRecord[]> {
  const rows = await prisma.followRequest.findMany({
    where: { requesterId: userId, status: FollowRequestStatus.PENDING },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      status: true,
      receiver: { select: userSummarySelect },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    tab: "sent-follow-requests",
    createdAt: row.createdAt.toISOString(),
    user: toUserSummary(row.receiver),
    status: row.status,
  }));
}
