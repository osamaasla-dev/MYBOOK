"use client";

import { PostCommentForm, PostCommentFormAvatar } from "../PostCommentForm";

type PostDetailsFooterProps = {
  postId: string;
  hasPost: boolean;
};

export function PostDetailsFooter({ postId, hasPost }: PostDetailsFooterProps) {
  if (!hasPost) {
    return null;
  }

  return (
    <footer className="border-t border-border/60 bg-secondary/10 px-2 py-2">
      <div className="flex items-start gap-2">
        <PostCommentFormAvatar />
        <div className="flex-1">
          <PostCommentForm postId={postId} />
        </div>
      </div>
    </footer>
  );
}
