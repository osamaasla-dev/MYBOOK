import { Prisma } from "@prisma/client";

export async function createFriendRecord(
  tx: Prisma.TransactionClient,
  viewerId: string,
  requesterId: string
) {
  const [userOneId, userTwoId] =
    viewerId < requesterId ? [viewerId, requesterId] : [requesterId, viewerId];

  let createdFriendRecord = false;

  try {
    await tx.friend.create({
      data: {
        userOneId,
        userTwoId,
      },
    });
    createdFriendRecord = true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      createdFriendRecord = false;
    } else {
      throw error;
    }
  }

  if (createdFriendRecord) {
    await Promise.all([
      tx.user.update({
        where: { id: viewerId },
        data: { friendsCount: { increment: 1 } },
      }),
      tx.user.update({
        where: { id: requesterId },
        data: { friendsCount: { increment: 1 } },
      }),
    ]);
  }

  return { createdFriendRecord };
}
