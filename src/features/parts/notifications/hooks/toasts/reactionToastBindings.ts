"use client";

import toast from "react-hot-toast";

import type { UsePusherBinding } from "@/hooks/usePusherChannel";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import { reactionTypeToEmoji } from "@/features/parts/post/constants/reactions";
import type { ReactionOperation } from "@/features/parts/post/utils/reaction";
import type { ToastBindingContext } from "./types";

const POST_REACTION_EVENT = "post:reaction" as const;

type PostReactionToastPayload = {
  postId: string;
  reaction: PostReactionType;
  reactorId: string;
  reactorName?: string | null;
  operation: ReactionOperation;
};

type BuildReactionToastBindingsOptions = {
  context?: ToastBindingContext;
};

export function buildReactionToastBindings({
  context,
}: BuildReactionToastBindingsOptions = {}): UsePusherBinding<unknown>[] {
  return [
    {
      event: POST_REACTION_EVENT,
      onEvent: (payload) =>
        showPostReactionToast(
          payload as PostReactionToastPayload | undefined,
          context
        ),
    },
  ];
}

function showPostReactionToast(
  payload?: PostReactionToastPayload,
  context?: ToastBindingContext
) {
  if (!payload?.reaction || !payload.reactorId) return;
  if (context?.isPostModalOpenFor?.(payload.postId)) {
    return;
  }

  const reactorName = payload.reactorName?.trim() || "Someone";
  const emoji = reactionTypeToEmoji(payload.reaction) ?? "";

  toast(` ${reactorName}  ${emoji} your post `);
}
