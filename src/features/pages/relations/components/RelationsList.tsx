"use client";

import { type RefObject } from "react";

import { QueryError, QueryLoading, EmptyState } from "@/components";

import type { RelationListItem } from "../types";
import {
  RelationsListLoadingMore,
  RelationsListSentinel,
  RelationsListItems,
  RelationsListEnd,
} from "./RelationsList/index";

type RelationsListProps = {
  items: RelationListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onRetry: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  testId?: string;
};

export function RelationsList({
  items,
  isLoading,
  isError,
  errorMessage,
  isFetchingNextPage,
  hasNextPage,
  onRetry,
  listRef,
  sentinelRef,
  testId = "relations-list",
}: RelationsListProps) {
  const showEmpty = !isLoading && !isError && items.length === 0;

  return (
    <div
      ref={listRef}
      className="h-full overflow-y-auto rounded-xl border border-border/70 bg-card"
      role="region"
      aria-live="polite"
      aria-busy={isLoading || isFetchingNextPage}
      aria-label="Relations list"
      data-testid={testId}
    >
      {isLoading && !items.length && (
        <QueryLoading
          message="Loading relations..."
          testId={`${testId}-query-loading`}
        />
      )}

      {isError && (
        <QueryError
          message={errorMessage}
          onRetry={onRetry}
          testId={`${testId}-query-error`}
        />
      )}

      {showEmpty && (
        <EmptyState
          title="No Relations"
          message="No entries found for this tab yet."
          testId={`${testId}-empty-state`}
        />
      )}

      <RelationsListItems items={items} testId={`${testId}-items`} />

      {isFetchingNextPage && (
        <RelationsListLoadingMore testId={`${testId}-loading-more`} />
      )}

      {!hasNextPage && items.length > 0 && (
        <RelationsListEnd testId={`${testId}-end`} />
      )}

      <RelationsListSentinel
        sentinelRef={sentinelRef}
        testId={`${testId}-sentinel`}
      />
    </div>
  );
}
