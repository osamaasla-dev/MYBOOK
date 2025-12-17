export const POST_COMMENT_EVENT = "post:comment" as const;

export type PostCommentEventPayload = {
  postId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  contentPreview: string;
  replyToId?: string | null;
};
