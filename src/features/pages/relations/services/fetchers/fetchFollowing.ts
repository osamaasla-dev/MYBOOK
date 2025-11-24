import { prisma } from "@/lib/prisma";

import type { BaseTabQueryArgs, TabRecord } from "../shared";
import { toUserSummary, userSummarySelect } from "../shared";

export async function fetchFollowing({
  userId,
  take,
  cursor,
}: BaseTabQueryArgs): Promise<TabRecord[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      following: { select: userSummarySelect },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    tab: "following",
    createdAt: row.createdAt.toISOString(),
    user: toUserSummary(row.following),
  }));
}
