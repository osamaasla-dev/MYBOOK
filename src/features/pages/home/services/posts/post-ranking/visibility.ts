import { Visibility } from "@prisma/client";

import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking";

export function canViewerSeePost(
  visibility: Visibility,
  relationship: ViewerRelationshipSnapshot | undefined
) {
  if (!relationship) return false;
  if (relationship.isSelf) return true;

  switch (visibility) {
    case Visibility.PUBLIC:
      return true;
    case Visibility.FRIENDS:
      return relationship.isFriend;
    case Visibility.FRIENDS_FOLLOWERS:
      return relationship.isFriend || relationship.isFollower;
    case Visibility.ONLY_ME:
    default:
      return false;
  }
}
