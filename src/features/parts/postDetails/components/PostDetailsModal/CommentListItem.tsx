"use client";

import Link from "next/link";

import { AvatarBubble } from "@/features/parts/post/components/PostCard/AvatarBubble";
import type { PostCommentListItem } from "../../services/client/fetchPostCommentsApi";

function getRelativeTimestampLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffSeconds = Math.round(diffMs / 1000);

  const divisions: Array<{ amount: number; unit: string }> = [
    { amount: 60, unit: "s" },
    { amount: 60, unit: "m" },
    { amount: 24, unit: "h" },
    { amount: 7, unit: "d" },
    { amount: 4.34524, unit: "w" },
    { amount: 12, unit: "M" },
    { amount: Number.POSITIVE_INFINITY, unit: "y" },
  ];

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

type CommentListItemProps = {
  comment: PostCommentListItem;
};

export function CommentListItem({ comment }: CommentListItemProps) {
  const displayName =
    comment.author.name ?? comment.author.username ?? "Someone";
  const timestamp = getRelativeTimestampLabel(comment.createdAt);
  const profileHref = comment.author.username
    ? `/user/profile/${comment.author.username}`
    : null;

  return (
    <li className="flex gap-1">
      {profileHref ? (
        <Link
          href={profileHref}
          className="inline-flex"
          aria-label={`View ${displayName}'s profile`}
        >
          <AvatarBubble
            name={displayName}
            avatarUrl={comment.author.avatarUrl ?? undefined}
            className="h-8 w-8 text-sm"
            imageClassName="h-8 w-8"
          />
        </Link>
      ) : (
        <AvatarBubble
          name={displayName}
          avatarUrl={comment.author.avatarUrl ?? undefined}
          className="h-8 w-8 text-sm"
          imageClassName="h-8 w-8"
        />
      )}
      <div className="flex flex-col gap-0.5">
        <div className="w-fit rounded-xl bg-secondary px-2 py-1">
          <div className="flex flex-col">
            {profileHref ? (
              <Link href={profileHref} className="text-xs font-semibold ">
                {displayName}
              </Link>
            ) : (
              <p className="text-xs font-semibold text-foreground">
                {displayName}
              </p>
            )}
            <p className="text-sm text-foreground">{comment.content}</p>
          </div>
        </div>
        <time className="px-2 text-xs text-muted-foreground">{timestamp}</time>
      </div>
    </li>
  );
}
