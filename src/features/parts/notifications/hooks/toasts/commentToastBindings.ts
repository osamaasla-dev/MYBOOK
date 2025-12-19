"use client";

import toast from "react-hot-toast";

import type { UsePusherBinding } from "@/hooks/usePusherChannel";
import type { CommentToastPayload, ToastBindingContext } from "./types";

const POST_COMMENT_EVENT = "post:comment" as const;

type BuildCommentToastBindingsOptions = {
  context?: ToastBindingContext;
};

export function buildCommentToastBindings({
  context,
}: BuildCommentToastBindingsOptions = {}): UsePusherBinding<unknown>[] {
  return [
    {
      event: POST_COMMENT_EVENT,
      onEvent: (payload) =>
        showPostCommentToast(
          payload as CommentToastPayload | undefined,
          context
        ),
    },
  ];
}

function showPostCommentToast(
  payload: CommentToastPayload | undefined,
  context?: ToastBindingContext
) {
  if (!payload?.postId || !payload.authorName) {
    return;
  }

  if (context?.isPostModalOpenFor?.(payload.postId)) {
    return;
  }

  const authorName = payload.authorName.trim() || "Someone";

  toast(`${authorName} commented on your post`);
}
