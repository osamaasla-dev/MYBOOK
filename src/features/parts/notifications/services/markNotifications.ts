import { prisma } from "@/lib/prisma";

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId, isRead: false },
    data: { isRead: true },
  });
}
