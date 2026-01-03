import { Prisma } from "@prisma/client";

import type {
  RankedUserRow,
  UserSearchResult,
} from "@/features/pages/search/types";
import {
  decodeCursor,
  encodeCursor,
  normalizeRankedUserRow,
} from "@/features/pages/search/utils";
import { prisma } from "@/lib/prisma";

export type FetchSearchableUsersParams = {
  viewerId: string;
  query: string;
  cursor?: string;
  limit: number;
};

export async function fetchSearchableUsers({
  viewerId,
  query,
  cursor,
  limit,
}: FetchSearchableUsersParams): Promise<{
  items: UserSearchResult[];
  nextCursor: string | null;
}> {
  const cursorPayload = cursor ? decodeCursor(cursor) : null;
  const pattern = `%${query.toLowerCase()}%`;
  const limitPlusOne = limit + 1;
  const weightFloor = -1_000_000_000;

  const cursorCondition = cursorPayload
    ? Prisma.sql`
        WHERE (
          ranked.priority_bucket > ${cursorPayload.priority}
          OR (
            ranked.priority_bucket = ${cursorPayload.priority}
            AND ranked.weight_sort > ${cursorPayload.weight}
          )
          OR (
            ranked.priority_bucket = ${cursorPayload.priority}
            AND ranked.weight_sort = ${cursorPayload.weight}
            AND ranked.name_sort > ${cursorPayload.name}
          )
          OR (
            ranked.priority_bucket = ${cursorPayload.priority}
            AND ranked.weight_sort = ${cursorPayload.weight}
            AND ranked.name_sort = ${cursorPayload.name}
            AND ranked.id > ${cursorPayload.id}
          )
        )
      `
    : Prisma.empty;

  const rankedUsers = await prisma.$queryRaw<RankedUserRow[]>(Prisma.sql`
    WITH ranked AS (
      SELECT
        u.id,
        u.name,
        u.username,
        u."avatarUrl",
        (fr."id" IS NOT NULL) AS is_friend,
        (fol_viewer."id" IS NOT NULL) AS is_following,
        CASE
          WHEN fr."id" IS NOT NULL THEN 1
          WHEN fol_viewer."id" IS NOT NULL THEN 2
          WHEN ui."interactionWeight" IS NOT NULL THEN 3
          WHEN fol_user."id" IS NOT NULL THEN 4
          ELSE 5
        END AS priority_bucket,
        COALESCE(ui."interactionWeight", ${weightFloor}) AS weight_sort,
        lower(COALESCE(u.name, u.username)) AS name_sort
      FROM "User" u
      LEFT JOIN "PrivacySetting" ps ON ps."userId" = u."id"
      LEFT JOIN "Friend" fr
        ON (
          (fr."userOneId" = ${viewerId} AND fr."userTwoId" = u."id") OR
          (fr."userTwoId" = ${viewerId} AND fr."userOneId" = u."id")
        )
      LEFT JOIN "Follow" fol_viewer
        ON fol_viewer."followerId" = ${viewerId} AND fol_viewer."followingId" = u."id"
      LEFT JOIN "Follow" fol_user
        ON fol_user."followerId" = u."id" AND fol_user."followingId" = ${viewerId}
      LEFT JOIN "UserInteractionStats" ui
        ON ui."userId" = ${viewerId} AND ui."targetUserId" = u."id"
      WHERE
        u."id" <> ${viewerId}
        AND (
          ps."searchVisibility" IS TRUE
          OR ps."searchVisibility" IS NULL
        )
        AND (
          LOWER(u."name") LIKE ${pattern}
          OR LOWER(u."username") LIKE ${pattern}
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "Block" b
          WHERE b."blockerId" = ${viewerId}
            AND b."blockedId" = u."id"
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "Block" b2
          WHERE b2."blockedId" = ${viewerId}
            AND b2."blockerId" = u."id"
        )
    )
    SELECT *
    FROM ranked
    ${cursorCondition}
    ORDER BY
      ranked.priority_bucket ASC,
      ranked.weight_sort DESC,
      ranked.name_sort ASC,
      ranked.id ASC
    LIMIT ${limitPlusOne}
  `);

  const normalizedUsers = rankedUsers.map(normalizeRankedUserRow);

  let nextCursor: string | null = null;
  let items = normalizedUsers;

  if (normalizedUsers.length > limit) {
    const nextItem = normalizedUsers.pop();
    items = normalizedUsers;
    if (nextItem) {
      nextCursor = encodeCursor({
        priority: nextItem.priority_bucket,
        weight: nextItem.weight_sort,
        name: nextItem.name_sort,
        id: nextItem.id,
      });
    }
  }

  const results: UserSearchResult[] = items.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    relationship: {
      isFriend: user.is_friend,
      isFollowing: user.is_following,
    },
  }));

  return { items: results, nextCursor };
}
