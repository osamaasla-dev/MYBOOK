import { NotificationType, Prisma } from "@prisma/client";

export type PrismaTransaction = Prisma.TransactionClient;

export type FollowNotificationPayload = {
  followerId: string;
  followerUsername: string;
  targetUserId: string;
  targetUsername: string;
};

export type FollowNotificationMetadata = {
  followerUsername: string;
  followerName: string | null;
  targetUsername: string;
  targetName: string | null;
  occurredAt: string;
};

export type NotificationActorSummary = {
  id: string;
  username: string;
  avatarUrl: string | null;
  name: string;
};

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  metadata: Prisma.JsonValue | null;
  isRead: boolean;
  createdAt: string;
  actor: NotificationActorSummary | null;
  related: {
    followId: string | null;
    postId: string | null;
    commentId: string | null;
  };
};

export type FetchNotificationsInput = {
  userId: string;
  limit: number;
  cursor?: string;
  unreadOnly?: boolean;
};

export type NotificationListResult = {
  items: NotificationListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
};
