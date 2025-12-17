import type { FeedRelationshipSnapshot } from "@/features/pages/home/utils/posts/feed-response";
import type {
  FeedPost,
  FeedPostAuthor,
  FeedPostContent,
  FeedPostMedia,
} from "@/features/pages/home/utils/posts/feed-response";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";

export type FeedPostRecord = {
  id: string;
  authorId: string;
  content: string | null;
  richContent: unknown | null;
  linkPreview: unknown | null;
  publishedAt: Date;
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
  viewCount: number;
  reactionSummary: unknown;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    isPrivate: boolean;
  };
  media: {
    id: string;
    url: string;
    type: string;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
  }[];
};

type BuildFeedPostOptions = {
  post: FeedPostRecord;
  relationship: FeedRelationshipSnapshot;
  viewerReaction: PostReactionType | null;
};

function buildAuthor(
  post: FeedPostRecord,
  relationship: FeedRelationshipSnapshot
) {
  const author: FeedPostAuthor = {
    id: post.author.id,
    name: post.author.name ?? post.author.username ?? "User",
    username: post.author.username ?? undefined,
    avatarUrl: post.author.avatarUrl ?? undefined,
    isVerified: post.author.isVerified,
    isPrivate: post.author.isPrivate,
    isFollowing: relationship.isFollower,
    isFriend: relationship.isFriend,
    isSelf: relationship.isSelf,
  };
  return author;
}

function buildContent(post: FeedPostRecord): FeedPostContent {
  const media: FeedPostMedia[] = post.media.map((item) => ({
    id: item.id,
    url: item.url,
    type: item.type,
  }));

  return {
    text: post.content ?? null,
    richText: post.richContent ?? null,
    media,
    linkPreview: post.linkPreview ?? null,
  };
}

function normalizeReactionSummary(
  value: unknown
): Record<string, number> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).reduce<Record<string, number>>(
    (acc, [key, val]) => {
      if (typeof val === "number") {
        acc[key] = val;
      }
      return acc;
    },
    {}
  );

  return Object.keys(entries).length ? entries : undefined;
}

export function buildFeedPost({
  post,
  relationship,
  viewerReaction,
}: BuildFeedPostOptions): FeedPost {
  return {
    postId: post.id,
    author: buildAuthor(post, relationship),
    publishedAt: post.publishedAt,
    content: buildContent(post),
    reactionsCount: post.reactionsCount,
    commentsCount: post.commentsCount,
    sharesCount: post.sharesCount,
    viewCount: post.viewCount,
    interactions: {
      hasLiked: Boolean(viewerReaction),
      hasCommented: false,
      hasShared: false,
      viewerReaction,
    },
    reactionSummary: normalizeReactionSummary(post.reactionSummary),
  };
}
