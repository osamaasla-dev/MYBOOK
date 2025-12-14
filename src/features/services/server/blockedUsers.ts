import { prisma } from "@/lib/prisma";

export async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: {
      blockerId: true,
      blockedId: true,
    },
  });

  const blocked = new Set<string>();
  for (const block of blocks) {
    if (block.blockerId === userId) {
      blocked.add(block.blockedId);
    }
    if (block.blockedId === userId) {
      blocked.add(block.blockerId);
    }
  }

  return blocked;
}
