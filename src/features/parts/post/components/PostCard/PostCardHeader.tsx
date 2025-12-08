import { MoreHorizontal } from "lucide-react";

import type { PostAuthor } from "./types";
import { AvatarBubble } from "./AvatarBubble";
import { formatRelativeTime } from "./utils";
import Link from "next/link";

type PostCardHeaderProps = {
  author: PostAuthor;
  timestamp?: Date | string;
};

export function PostCardHeader({ author, timestamp }: PostCardHeaderProps) {
  const formattedTime = timestamp ? formatRelativeTime(timestamp) : null;
  const profileHref = author.username
    ? `/user/profile/${author.username}`
    : undefined;

  return (
    <header className="flex items-start gap-3 px-4">
      {profileHref ? (
        <Link href={profileHref}>
          <AvatarBubble name={author.name} avatarUrl={author.avatarUrl} />
        </Link>
      ) : (
        <AvatarBubble name={author.name} avatarUrl={author.avatarUrl} />
      )}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
          {profileHref ? (
            <Link href={profileHref}>{author.name}</Link>
          ) : (
            <span>{author.name}</span>
          )}

          {author.isFollowing && (
            <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs font-semibold text-primary/80">
              Following
            </span>
          )}
        </div>
        {formattedTime && (
          <p className="text-xs text-muted-foreground">{formattedTime}</p>
        )}
      </div>
      <button
        type="button"
        className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary"
        aria-label="more options"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </button>
    </header>
  );
}
