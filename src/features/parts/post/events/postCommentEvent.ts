export const POST_COMMENT_EVENT = "post:comment" as const;

export type PostCommentEventPayload = {
  postId: string;
  commentId: string;
  commentAuthorId: string;
  authorName: string;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  contentPreview: string;
  replyToId?: string | null;
  commentsCount: number;
};
