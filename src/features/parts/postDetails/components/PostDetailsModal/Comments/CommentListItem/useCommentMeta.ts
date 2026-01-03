"use client";

import { useMemo } from "react";

import type { PostCommentListItem } from "@/features/parts/postDetails/services/client/fetchPostCommentsApi";

export function useCommentMeta(comment: PostCommentListItem) {
  const displayName = useMemo(
    () => comment.author.name ?? comment.author.username ?? "Someone",
    [comment.author.name, comment.author.username]
  );

  const profileHref = useMemo(() => {
    if (!comment.author.username) return null;
    return `/user/profile/${comment.author.username}`;
  }, [comment.author.username]);

  const timestamp = useMemo(
    () => getRelativeTimestampLabel(comment.createdAt),
    [comment.createdAt]
  );

  const editedTimestamp = useMemo(
    () => getRelativeTimestampLabel(comment.updatedAt),
    [comment.updatedAt]
  );

  return {
    displayName,
    profileHref,
    timestamp,
    editedTimestamp,
  };
}

function getRelativeTimestampLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  if (diffSeconds < 60) {
    return "just now";
  }

  const divisions = [
    { amount: 60, unit: "s" },
    { amount: 60, unit: "m" },
    { amount: 24, unit: "h" },
    { amount: 7, unit: "d" },
    { amount: 4.34524, unit: "w" },
    { amount: 12, unit: "M" },
    { amount: Number.POSITIVE_INFINITY, unit: "y" },
  ] as const;

  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      const value = Math.abs(duration);
      return `${value}${division.unit}`;
    }
    duration = Math.round(duration / division.amount);
  }

  return `${Math.abs(duration)}y`;
}
