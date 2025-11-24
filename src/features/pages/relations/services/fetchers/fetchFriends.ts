import { prisma } from "@/lib/prisma";

import { toUserSummary, userSummarySelect } from "../shared";
import type { BaseTabQueryArgs, TabRecord } from "../shared";

export async function fetchFriends({
  userId,
  take,
  cursor,
}: BaseTabQueryArgs): Promise<TabRecord[]> {
  const rows = await prisma.friend.findMany({
    where: {
      OR: [{ userOneId: userId }, { userTwoId: userId }],
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      userOneId: true,
      userTwoId: true,
      userOne: { select: userSummarySelect },
      userTwo: { select: userSummarySelect },
    },
  });

  return rows.map((row) => {
    const isUserOne = row.userOneId === userId;
    const friendUser = isUserOne ? row.userTwo : row.userOne;

    return {
      id: row.id,
      tab: "friends",
      createdAt: row.createdAt.toISOString(),
      user: toUserSummary(friendUser),
    } satisfies TabRecord;
  });
}
