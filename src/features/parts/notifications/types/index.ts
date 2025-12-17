import { NotificationType, Prisma } from "@prisma/client";

import type { NotificationTab } from "../constants";

export type PrismaTransaction = Prisma.TransactionClient;

export type NotificationActorSummary = {
  id: string;
  username: string;
  avatarUrl: string | null;
  name: string;
};

export type NotificationGroupingSummary = {
  totalActors: number;
  othersCount: number;
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
  grouping?: NotificationGroupingSummary | null;
};

export type FetchNotificationsInput = {
  userId: string;
  limit: number;
  cursor?: string;
  tab?: NotificationTab;
};

export type NotificationListResult = {
  items: NotificationListItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
};
