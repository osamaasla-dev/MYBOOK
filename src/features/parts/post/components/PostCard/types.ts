import type { PostReactionType } from "../../constants/reactions";
import type { ReactionSummary } from "../../utils/reaction";

export type PostAuthor = {
  name: string;
  username?: string;
  avatarUrl?: string;
  isFollowing?: boolean;
  isFriend?: boolean;
  isSelf?: boolean;
};

export type PostStats = {
  reactions?: number;
  comments?: number;
  shares?: number;
  reactionsEmoji?: string;
  viewerReaction?: PostReactionType | null;
  reactionSummary?: ReactionSummary;
};

export type PostCardMedia = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  posterUrl?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

export type PostCardContent = {
  text: string;
  backgroundColor?: string;
  media?: PostCardMedia[];
};

export type PostCardProps = {
  postId: string;
  author: PostAuthor;
  timestamp?: Date | string;
  content: PostCardContent;
  stats?: PostStats;
  className?: string;
};
