import { PostVisibilityPreference, Prisma, Visibility } from "@prisma/client";

import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking/types";

type BuildVisibilityFiltersParams = {
  viewerId: string;
  authorIds: string[];
  relations: Map<string, ViewerRelationshipSnapshot>;
};

export function buildFeedVisibilityFilters(
  params: BuildVisibilityFiltersParams
) {
  const { viewerId, authorIds, relations } = params;
  const filters: Prisma.PostWhereInput[] = [];

  for (const authorId of authorIds) {
    const relationship =
      relations.get(authorId) ??
      createDefaultRelationshipSnapshot(viewerId, authorId);

    if (relationship.isSelf) {
      filters.push({ authorId });
      continue;
    }

    const authorClauses: Prisma.PostWhereInput[] = [];
    const allowedOverrideVisibilities =
      getAllowedOverrideVisibilities(relationship);

    if (allowedOverrideVisibilities.length) {
      authorClauses.push({
        visibilityPreference: PostVisibilityPreference.OVERRIDE,
        visibility: { in: allowedOverrideVisibilities },
      });
    }

    const allowedDefaultVisibilities =
      getAllowedAccountDefaultVisibilities(relationship);

    if (allowedDefaultVisibilities.length) {
      authorClauses.push({
        visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
        author: {
          privacySetting: {
            postsVisibility: { in: allowedDefaultVisibilities },
          },
        },
      });
    }

    if (authorClauses.length) {
      filters.push({
        authorId,
        OR: authorClauses,
      });
    }
  }

  return filters;
}

function getAllowedOverrideVisibilities(
  relationship: ViewerRelationshipSnapshot
) {
  const options = new Set<Visibility>([Visibility.PUBLIC]);

  if (relationship.isFriend) {
    options.add(Visibility.FRIENDS);
  }

  if (relationship.isFriend || relationship.isFollower) {
    options.add(Visibility.FRIENDS_FOLLOWERS);
  }

  if (relationship.isSelf) {
    options.add(Visibility.ONLY_ME);
  }

  return Array.from(options);
}

function getAllowedAccountDefaultVisibilities(
  relationship: ViewerRelationshipSnapshot
) {
  const allowed = new Set<Visibility>();

  allowed.add(Visibility.PUBLIC);

  if (relationship.isFriend) {
    allowed.add(Visibility.FRIENDS);
  }

  if (relationship.isFriend || relationship.isFollower) {
    allowed.add(Visibility.FRIENDS_FOLLOWERS);
  }

  if (relationship.isSelf) {
    allowed.add(Visibility.ONLY_ME);
  }

  return Array.from(allowed);
}

function createDefaultRelationshipSnapshot(
  viewerId: string,
  authorId: string
): ViewerRelationshipSnapshot {
  return {
    isSelf: viewerId === authorId,
    isFriend: false,
    isFollower: false,
  };
}
