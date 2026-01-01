import { prisma } from "@/lib/prisma";

export type BlockStatus = {
  primaryBlocksSecondary: boolean;
  secondaryBlocksPrimary: boolean;
  anyBlock: boolean;
};

export async function isBlock(
  primaryUserId: string,
  secondaryUserId: string
): Promise<BlockStatus> {
  if (!primaryUserId || !secondaryUserId) {
    return {
      primaryBlocksSecondary: false,
      secondaryBlocksPrimary: false,
      anyBlock: false,
    };
  }

  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: primaryUserId, blockedId: secondaryUserId },
        { blockerId: secondaryUserId, blockedId: primaryUserId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });

  const primaryBlocksSecondary = blocks.some(
    (record) =>
      record.blockerId === primaryUserId && record.blockedId === secondaryUserId
  );

  const secondaryBlocksPrimary = blocks.some(
    (record) =>
      record.blockerId === secondaryUserId && record.blockedId === primaryUserId
  );

  return {
    primaryBlocksSecondary,
    secondaryBlocksPrimary,
    anyBlock: primaryBlocksSecondary || secondaryBlocksPrimary,
  };
}
