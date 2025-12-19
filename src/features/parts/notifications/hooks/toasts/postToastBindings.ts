"use client";

import toast from "react-hot-toast";

import type { UsePusherBinding } from "@/hooks/usePusherChannel";

const POST_CREATED_EVENT = "post:created" as const;

type PostCreatedToastPayload = {
  postId: string;
  authorId: string;
  authorName?: string | null;
};

export function buildPostToastBindings(): UsePusherBinding<unknown>[] {
  return [
    {
      event: POST_CREATED_EVENT,
      onEvent: (payload) =>
        showPostToast(payload as PostCreatedToastPayload | undefined),
    },
  ];
}

function showPostToast(payload?: PostCreatedToastPayload) {
  if (!payload) return;

  const authorName = payload.authorName?.trim() || "Someone";
  toast(`${authorName} shared a new post`);
}
