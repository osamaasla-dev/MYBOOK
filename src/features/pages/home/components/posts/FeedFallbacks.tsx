"use client";

import { EmptyState, QueryError, QueryLoading } from "@/components";

export function FeedInitialLoading({
  message = "Loading feed...",
}: {
  message?: string;
}) {
  return <QueryLoading message={message} className="w-full" />;
}

export function FeedErrorState({
  onRetry,
  retryLabel = "Retry",
  message = "Something went wrong while loading the feed.",
  title = "Loading error",
}: {
  onRetry: () => void;
  retryLabel?: string;
  message?: string;
  title?: string;
}) {
  return (
    <QueryError
      message={message}
      title={title}
      onRetry={onRetry}
      retryLabel={retryLabel}
      className="w-full"
    />
  );
}

export function FeedEmptyState({
  title = "No posts yet",
  message = "Follow friends to see new posts.",
}: {
  title?: string;
  message?: string;
}) {
  return <EmptyState title={title} message={message} className="bg-white" />;
}
