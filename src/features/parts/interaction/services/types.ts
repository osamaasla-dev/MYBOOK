import { PrismaClient, Prisma } from "@prisma/client";

export type InteractionType = "react" | "comment" | "message" | "profileVisit";

export type RelationshipWeightKey = "friend" | "follow";

export type NegativeWeightKey =
  | "unfriend"
  | "unfollow"
  | "hidePost"
  | "report"
  | "notInterested"
  | "unreact"
  | "deleteComment";

export type InteractionWeightKey =
  | InteractionType
  | RelationshipWeightKey
  | NegativeWeightKey;

export type RecordInteractionInput = {
  actorId: string;
  targetUserId: string;
  type: InteractionType;
};

export type AdjustRelationshipSnapshotInput = {
  actorId: string;
  targetUserId: string;
  isFriend?: boolean;
  isFollowing?: boolean;
  prismaClient?: PrismaClient | Prisma.TransactionClient;
};

export type NegativeSignalInput = {
  actorId: string;
  targetUserId: string;
  type: NegativeWeightKey;
};

export type AdjustInteractionWeightInput = {
  actorId: string;
  targetUserId: string;
  delta: number;
};
