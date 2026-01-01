import { prisma } from "@/lib/prisma";

import { toUserSummary, userSummarySelect } from "../shared";
import type { BaseTabQueryArgs, TabRecord } from "../shared";

export async function fetchBlocked({
  userId,
  take,
  cursor,
}: BaseTabQueryArgs): Promise<TabRecord[]> {
  const rows = await prisma.block.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor } } : {}),
    select: {
      id: true,
      createdAt: true,
      blocked: { select: userSummarySelect },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    tab: "blocked",
    createdAt: row.createdAt.toISOString(),
    user: toUserSummary(row.blocked),
  }));
}
