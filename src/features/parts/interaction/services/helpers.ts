import type { Prisma, PrismaClient } from "@prisma/client";

export type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export async function incrementTotalInteractedUsers(
  client: PrismaClientOrTx,
  userId: string
) {
  if (!userId) return;

  await client.user.update({
    where: { id: userId },
    data: {
      totalInteractedUsers: { increment: 1 },
    },
  });
}
