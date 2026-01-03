"use client";

import { type RefObject } from "react";

import type { PostReactionListItem } from "../../services/server/reactions";

import { ReactionUserAvatar } from "./ReactionUserAvatar";
import { EmptyState, QueryError, QueryLoading } from "@/components";
import Link from "next/link";

type ReactionsListProps = {
  items: PostReactionListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
  isFetchingNextPage: boolean;
  testId?: string;
};

export function ReactionsList({
  items,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  sentinelRef,
  isFetchingNextPage,
  testId,
}: ReactionsListProps) {
  if (isLoading)
    return <QueryLoading data-testid={testId || "reactions-list-loading"} />;

  if (isError)
    return (
      <QueryError
        message={errorMessage}
        onRetry={onRetry}
        data-testid={testId || "reactions-list-error"}
      />
    );

  if (items.length === 0)
    return (
      <EmptyState
        message="No one reacted yet."
        title=""
        data-testid={testId || "reactions-list-empty"}
      />
    );

  return (
    <ul
      className="flex flex-col"
      role="list"
      aria-label={`Reactions list (${items.length} items)`}
      data-testid={testId || "reactions-list"}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center justify-between px-1 py-3"
          role="listitem"
          data-testid={
            testId ? `${testId}-item-${index}` : `reactions-list-item-${index}`
          }
        >
          <div className="flex items-center gap-3">
            <ReactionUserAvatar
              name={item.user.name ?? item.user.username}
              username={item.user.username}
              avatarUrl={item.user.avatarUrl}
              testId={
                testId
                  ? `${testId}-avatar-${index}`
                  : `reactions-list-avatar-${index}`
              }
            />
            <div className="flex flex-col">
              <Link
                href={`/user/profile/${encodeURIComponent(item.user.username)}`}
                className="text-sm font-semibold text-foreground"
                aria-label={`View ${
                  item.user.name ?? item.user.username
                }'s profile`}
                data-testid={
                  testId
                    ? `${testId}-name-${index}`
                    : `reactions-list-name-${index}`
                }
              >
                {item.user.name ?? item.user.username}
              </Link>
            </div>
          </div>
          <span
            className="text-2xl"
            aria-hidden="true"
            aria-label={`${item.emoji} reaction`}
            data-testid={
              testId
                ? `${testId}-emoji-${index}`
                : `reactions-list-emoji-${index}`
            }
          >
            {item.emoji}
          </span>
        </li>
      ))}
      <div
        ref={sentinelRef}
        className="h-6 w-full"
        aria-hidden="true"
        data-testid={testId ? `${testId}-sentinel` : "reactions-list-sentinel"}
      />
      {isFetchingNextPage && (
        <p
          className="py-2 text-center text-sm text-muted-foreground"
          aria-live="polite"
          data-testid={
            testId ? `${testId}-loading-more` : "reactions-list-loading-more"
          }
        >
          Loading more…
        </p>
      )}
    </ul>
  );
}
