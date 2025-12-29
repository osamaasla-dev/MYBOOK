"use client";

import { type RefObject } from "react";
import { Loader2 } from "lucide-react";

import { QueryError, QueryLoading } from "@/components";

import type { RelationListItem } from "../types";
import { RelationListItem as RelationListItemRow } from "./RelationListItem";

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
}: RelationsListProps) {
  const showEmpty = !isLoading && !isError && items.length === 0;

  return (
    <div
      ref={listRef}
      className="h-full overflow-y-auto rounded-xl border border-border/70 bg-card"
      role="region"
      aria-live="polite"
      aria-busy={isLoading || isFetchingNextPage}
    >
      {isLoading && !items.length && (
        <div className="px-6 py-12">
          <QueryLoading message="Loading relations..." />
        </div>
      )}

      {isError && (
        <div className="px-6 py-10">
          <QueryError message={errorMessage} onRetry={onRetry} />
        </div>
      )}

      {showEmpty && (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          No entries found for this tab yet.
        </div>
      )}

      <ul role="list" className="divide-y divide-border/70">
        {items.map((item) => (
          <RelationListItemRow key={`${item.tab}-${item.id}`} item={item} />
        ))}
      </ul>

      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading more...
        </div>
      )}

      {!hasNextPage && items.length > 0 && (
        <div className="px-4 py-4 text-center text-xs text-muted-foreground">
          You have reached the end.
        </div>
      )}

      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
    </div>
  );
}
