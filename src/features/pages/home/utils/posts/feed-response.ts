import type { PostReactionType } from "@/features/parts/post/constants/reactions";

export type FeedRelationshipSnapshot = {
  isSelf: boolean;
  isFriend: boolean;
  isFollower: boolean;
};

export type FeedPostAuthor = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isPrivate: boolean;
  isFollowing: boolean;
  isFriend: boolean;
  isSelf: boolean;
};

export type FeedPostMedia = {
  id: string;
  url: string;
  type: string;
};

export type FeedPostContent = {
  text: string | null;
  richText: unknown | null;
  media: FeedPostMedia[];
  linkPreview: unknown | null;
};

export type FeedPostInteractions = {
  hasLiked: boolean;
  hasCommented: boolean;
  hasShared: boolean;
  viewerReaction: PostReactionType | null;
};

export type FeedPost = {
  postId: string;
  author: FeedPostAuthor;
  publishedAt: Date;
  content: FeedPostContent;
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
  viewCount: number;
  interactions: FeedPostInteractions;
  reactionSummary?: Record<string, number>;
};

export type FeedPostsPage = {
  posts: FeedPost[];
  nextCursor: number | null;
};

export function createFeedRelationshipSnapshot(
  viewerId: string,
  authorId: string
): FeedRelationshipSnapshot {
  const isSelf = viewerId === authorId;
  return {
    isSelf,
    isFriend: false,
    isFollower: false,
  };
}
