import { Visibility } from "@prisma/client";

import { canViewerSeePost } from "../visibility";
import { resolveEffectiveVisibility } from "../privacy";
import type {
  PostWithStats,
  ViewerRelationshipSnapshot,
} from "@/features/pages/home/utils/posts/post-ranking/types";
import type { RawFetchedPost } from "./query";

export type FilterPostsParams = {
  posts: RawFetchedPost[];
  viewerId: string;
  privacyDefaults: Map<string, Visibility>;
  relations: Map<string, ViewerRelationshipSnapshot>;
};

export function filterPostsByVisibility(
  params: FilterPostsParams
): PostWithStats[] {
  const { posts, viewerId, privacyDefaults, relations } = params;

  return posts
    .map((post) => {
      const authorDefaultVisibility =
        privacyDefaults.get(post.authorId) ?? Visibility.PUBLIC;
      const effectiveVisibility = resolveEffectiveVisibility(
        post.visibility,
        post.visibilityPreference,
        authorDefaultVisibility
      );
      const relationship =
        relations.get(post.authorId) ??
        createDefaultRelationshipSnapshot(viewerId, post.authorId);

      return {
        post,
        effectiveVisibility,
        relationship,
      };
    })
    .filter(({ effectiveVisibility, relationship }) =>
      canViewerSeePost(effectiveVisibility, relationship)
    )
    .map(({ post, effectiveVisibility, relationship }) => ({
      id: post.id,
      authorId: post.authorId,
      publishedAt: post.publishedAt,
      content: {
        text: post.content,
        richText: post.richContent,
        media: post.media.map((media) => ({
          id: media.id,
          url: media.url,
          type: media.type,
          width: media.width,
          height: media.height,
          duration: media.duration,
        })),
        linkPreview: post.linkPreview,
      },
      likesCount: post.reactionsCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      viewCount: post.viewCount,
      reactionSummary: post.reactionSummary,
      author: post.author,
      privacy: {
        visibility: post.visibility,
        visibilityPreference: post.visibilityPreference,
        effectiveVisibility,
      },
      viewerRelationship: relationship,
    }));
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
