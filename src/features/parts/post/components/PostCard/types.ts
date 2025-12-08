export type PostAuthor = {
  name: string;
  username?: string;
  avatarUrl?: string;
  secondaryLabel?: string;
  isFollowing?: boolean;
};

export type PostStats = {
  reactions?: number;
  comments?: number;
  shares?: number;
  reactionsEmoji?: string;
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
  author: PostAuthor;
  timestamp?: Date | string;
  content: PostCardContent;
  stats?: PostStats;
  className?: string;
};
