import type { FeedRelationshipSnapshot } from "@/features/pages/home/utils/posts/feed-response";
import { buildViewerRelationshipMap } from "@/features/pages/home/services/posts/post-ranking/relationships";

type ResolvePostAuthorRelationshipInput = {
  viewerId: string | null;
  authorId: string;
};

const defaultRelationship: FeedRelationshipSnapshot = {
  isSelf: false,
  isFriend: false,
  isFollower: false,
};

export async function resolvePostAuthorRelationship({
  viewerId,
  authorId,
}: ResolvePostAuthorRelationshipInput): Promise<FeedRelationshipSnapshot> {
  if (!viewerId) {
    return defaultRelationship;
  }

  if (viewerId === authorId) {
    return {
      isSelf: true,
      isFriend: false,
      isFollower: false,
    };
  }

  const relations = await buildViewerRelationshipMap(viewerId, [authorId]);
  return relations.get(authorId) ?? defaultRelationship;
}
