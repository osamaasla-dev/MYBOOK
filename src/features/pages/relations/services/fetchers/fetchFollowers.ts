import { prisma } from "@/lib/prisma";

import { toUserSummary, userSummarySelect } from "../shared";
import type { BaseTabQueryArgs, TabRecord } from "../shared";

export async function fetchFollowers({
  userId,
  take,
  cursor,
}: BaseTabQueryArgs): Promise<TabRecord[]> {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      follower: { select: userSummarySelect },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    tab: "followers",
    createdAt: row.createdAt.toISOString(),
    user: toUserSummary(row.follower),
  }));
}
