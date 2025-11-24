import { Prisma } from "@prisma/client";

import type { RelationListItem, RelationUserSummary } from "../types";

export const userSummarySelect = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  bio: true,
} satisfies Prisma.UserSelect;

export type BaseTabQueryArgs = {
  userId: string;
  take: number;
  cursor?: string;
};

export type TabRecord = RelationListItem;

export function toUserSummary(user: RelationUserSummary): RelationUserSummary {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
  };
}
