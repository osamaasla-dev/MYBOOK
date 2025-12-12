import type {
  MediaType,
  PostVisibilityPreference,
  Visibility,
} from "@prisma/client";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import type { ReactionSummary } from "@/features/parts/post/utils/reaction";

export type ViewerRelationshipSnapshot = {
  isSelf: boolean;
  isFriend: boolean;
  isFollower: boolean;
};

export type PostMediaAttachment = {
  id: string;
  url: string;
  type: MediaType;
  width: number | null;
  height: number | null;
  duration: number | null;
};

export type PostContentPayload = {
  text: string | null;
  richText: unknown | null;
  media: PostMediaAttachment[];
  linkPreview: unknown | null;
};

export type PostPrivacySnapshot = {
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  effectiveVisibility: Visibility;
};

export type PostAuthorMeta = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isPrivate: boolean;
};

export type PostWithStats = {
  id: string;
  authorId: string;
  publishedAt: Date;
  content: PostContentPayload;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewCount: number;
  reactionSummary: ReactionSummary | null;
  author: PostAuthorMeta;
  privacy: PostPrivacySnapshot;
  viewerRelationship: ViewerRelationshipSnapshot;
};

export type PostFetchResult = {
  authorId: string;
  posts: PostWithStats[];
};

export type PostInteractionFlags = {
  hasLiked: boolean;
  hasCommented: boolean;
  hasShared: boolean;
  viewerReaction: PostReactionType | null;
};

export type PostCandidate = {
  postId: string;
  authorId: string;
  publishedAt: Date;
  content: PostContentPayload;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewCount: number;
  reactionSummary: ReactionSummary | null;
  userScore: number;
  interactions: PostInteractionFlags;
  author: PostAuthorMeta;
  privacy: PostPrivacySnapshot;
  viewerRelationship: ViewerRelationshipSnapshot;
};

export type RankedPost = PostCandidate & {
  freshnessFactor: number;
  engagementScore: number;
  viewerBoost: number;
  finalScore: number;
};

export type PostRankingResult = {
  posts: RankedPost[];
};

export type RankedFeedPage = {
  posts: RankedPost[];
  nextCursor: number | null;
  total: number;
  storedAt: number | null;
  cacheHit: boolean;
};
