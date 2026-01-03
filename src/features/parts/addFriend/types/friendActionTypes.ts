import { Prisma } from "@prisma/client";

export type PrismaTransaction = Prisma.TransactionClient;

export type FriendNotificationKind =
  | "friend-request"
  | "friend-request-accepted"
  | "friend-request-rejected"
  | "friend-request-canceled";

export type FriendNotificationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "canceled";

export type FriendNotificationPayload = {
  requesterId: string;
  requesterUsername: string;
  targetUserId: string;
  targetUsername: string;
  requestId: string;
  kind: FriendNotificationKind;
  status?: FriendNotificationStatus;
};

export type FriendNotificationMetadata = {
  requesterUsername: string;
  requesterName: string | null;
  targetUsername: string;
  targetName: string | null;
  occurredAt: string;
  kind: FriendNotificationKind;
  status?: FriendNotificationStatus;
  requestId: string;
};
