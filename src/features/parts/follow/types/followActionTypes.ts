import { Prisma } from "@prisma/client";

export type PrismaTransaction = Prisma.TransactionClient;

export type FollowActionInput = {
  username: string;
};

export type FollowApiResponse = {
  message: string;
  status:
    | "FOLLOWED"
    | "UNFOLLOWED"
    | "REQUESTED"
    | "CANCELLED"
    | "APPROVED"
    | "REJECTED"
    | "REMOVED";
  requestId?: string;
};
export type FollowNotificationPayload = {
  followerId: string;
  followerUsername: string;
  targetUserId: string;
  targetUsername: string;
  kind: "follow" | "follow-request" | "follow-request-approved";
  status?: "pending" | "accepted" | "rejected" | "canceled";
};

export type FollowNotificationMetadata = {
  followerUsername: string;
  followerName: string | null;
  targetUsername: string;
  targetName: string | null;
  occurredAt: string;
  kind: FollowNotificationPayload["kind"];
  status?: FollowNotificationPayload["status"];
};
