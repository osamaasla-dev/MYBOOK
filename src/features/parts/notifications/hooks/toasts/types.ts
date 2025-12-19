export type ToastBindingContext = {
  isPostModalOpenFor: (postId?: string | null) => boolean;
};

export type NotificationToastBinding<T = unknown> = {
  event: string;
  handler: (payload: T) => void;
};

export type CommentToastPayload = {
  postId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  contentPreview: string;
  replyToId?: string | null;
};
