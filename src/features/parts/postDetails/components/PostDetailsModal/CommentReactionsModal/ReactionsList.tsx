"use client";

import { type RefObject } from "react";
import Link from "next/link";

import { EmptyState, QueryError, QueryLoading } from "@/components";
import type { CommentReactionListItem } from "@/features/parts/postDetails/services/server/comment/reactions/types";
import { ReactionUserAvatar } from "@/features/parts/post/components/PostReactionsModal/ReactionUserAvatar";

type ReactionsListProps = {
  items: CommentReactionListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
};

export function CommentReactionsList({
  items,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  sentinelRef,
  isFetchingNextPage,
}: ReactionsListProps) {
  if (isLoading) return <QueryLoading />;

  if (isError) return <QueryError message={errorMessage} onRetry={onRetry} />;

  if (items.length === 0)
    return <EmptyState message="No reactions yet." title="" />;

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between px-1 py-3"
        >
          <div className="flex items-center gap-3">
            <ReactionUserAvatar
              name={item.user.name ?? item.user.username}
              username={item.user.username}
              avatarUrl={item.user.avatarUrl}
            />
            <div className="flex flex-col">
              <Link
                href={`/user/profile/${encodeURIComponent(item.user.username)}`}
                className="text-sm font-semibold text-foreground"
              >
                {item.user.name ?? item.user.username}
              </Link>
            </div>
          </div>
          <span className="text-2xl" aria-hidden="true">
            {item.emoji}
          </span>
        </li>
      ))}
      <div ref={sentinelRef} className="h-6 w-full" />
      {isFetchingNextPage && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          Loading more…
        </p>
      )}
    </ul>
  );
}
