import { FollowRequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { BaseTabQueryArgs, TabRecord } from "../shared";
import { toUserSummary, userSummarySelect } from "../shared";

export async function fetchFollowRequests({
  userId,
  take,
  cursor,
}: BaseTabQueryArgs): Promise<TabRecord[]> {
  const rows = await prisma.followRequest.findMany({
    where: { receiverId: userId, status: FollowRequestStatus.PENDING },
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
    tab: "follow-requests",
    createdAt: row.createdAt.toISOString(),
    user: toUserSummary(row.requester),
    status: row.status,
  }));
}
