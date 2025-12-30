import { prisma } from "@/lib/prisma";
import { Visibility, PostVisibilityPreference } from "@prisma/client";
import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking/types";

export async function buildWhereClause(
  profileOwnerId: string,
  relationship?: ViewerRelationshipSnapshot
) {
  const baseWhere = {
    authorId: profileOwnerId,
    isDeleted: false,
    replyToId: null, // Only get original posts, not replies
    repostOfId: null, // Only get original posts, not reposts
  };

  // If viewer is profile owner, show all their posts
  if (relationship?.isSelf) {
    return baseWhere;
  }

  // Get account privacy settings
  const accountPrivacy = await prisma.privacySetting.findUnique({
    where: { userId: profileOwnerId },
    select: { postsVisibility: true },
  });

  return {
    authorId: profileOwnerId,
    isDeleted: false,
    replyToId: null,
    repostOfId: null,
    OR: [
      // OVERRIDE: استخدم الـ visibility الموجود في البوست نفسه
      {
        visibilityPreference: PostVisibilityPreference.OVERRIDE,
        OR: [
          { visibility: Visibility.PUBLIC },
          ...(relationship?.isFriend
            ? [{ visibility: Visibility.FRIENDS }]
            : []),
          ...(relationship?.isFriend || relationship?.isFollower
            ? [{ visibility: Visibility.FRIENDS_FOLLOWERS }]
            : []),
          ...(relationship?.isSelf ? [{ visibility: Visibility.ONLY_ME }] : []),
        ],
      },
      {
        visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
        OR: [
          ...(accountPrivacy?.postsVisibility === Visibility.PUBLIC
            ? [{}]
            : []),
          ...(accountPrivacy?.postsVisibility === Visibility.FRIENDS &&
          relationship?.isFriend
            ? [{}]
            : []),
          ...(accountPrivacy?.postsVisibility ===
            Visibility.FRIENDS_FOLLOWERS &&
          (relationship?.isFriend || relationship?.isFollower)
            ? [{}]
            : []),
          ...(accountPrivacy?.postsVisibility === Visibility.ONLY_ME &&
          relationship?.isSelf
            ? [{}]
            : []),
        ],
      },
    ],
  };
}
