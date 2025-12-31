"use client";

import { useCallback, useMemo, useRef } from "react";

import { QueryError, QueryLoading } from "@/components";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useUserSearchResults } from "@/features/parts/search/hooks";
import { USER_SEARCH_RESULTS_DEFAULT_LIMIT } from "@/features/parts/search/constants";

import { SearchResultCard } from "../components/SearchResultCard";

type SearchResultsPageProps = {
  initialQuery: string;
};

export function SearchResultsPage({ initialQuery }: SearchResultsPageProps) {
  const query = useMemo(() => initialQuery.trim(), [initialQuery]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserSearchResults({
    query,
    limit: USER_SEARCH_RESULTS_DEFAULT_LIMIT,
    enabled: Boolean(query),
  });

  const items = data?.items ?? [];
  const resultsCount = items.length;
  const resultsLabel = resultsCount === 1 ? "result" : "results";
  const resultsSummary =
    isLoading && !items.length ? "Searching…" : resultsCount;

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useInfiniteScroll({
    sentinelRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: loadMore,
    rootMargin: "0px 0px 300px 0px",
    enabled: Boolean(query) && Boolean(hasNextPage),
  });

  const showEmptyState = !isLoading && !isError && query && items.length === 0;

  return (
    <section className="bg-secondary/30 px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2 bg-white px-5 py-4 rounded-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            People directory
          </p>
          <h1 className="text-3xl font-extrabold text-primary">
            Search results
          </h1>
          {query ? (
            <p className="text-base text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                ({resultsSummary}) {resultsLabel}
              </span>{" "}
              for{" "}
              <span className="font-semibold text-foreground">“{query}”</span>
            </p>
          ) : (
            <p className="text-base text-muted-foreground">
              Type a name from the navbar search bar to see matching people.
            </p>
          )}
        </header>

        {!query ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-10 text-center text-muted-foreground">
            Enter a search term above to explore the community.
          </div>
        ) : (
          <div
            className="space-y-4"
            role="region"
            aria-live="polite"
            aria-busy={isLoading || isFetchingNextPage}
          >
            {isLoading && !items.length ? (
              <QueryLoading message="Searching for people..." />
            ) : null}

            {isError ? (
              <QueryError
                message={error?.message}
                onRetry={() => {
                  void refetch();
                }}
              />
            ) : null}

            {showEmptyState ? (
              <div className="rounded-3xl bg-card px-6 py-16 text-center text-muted-foreground">
                No people matched your search just yet.
              </div>
            ) : null}

            <ul className="space-y-3" role="list">
              {items.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </ul>

            {isFetchingNextPage ? (
              <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-center text-sm text-muted-foreground">
                Loading more profiles...
              </div>
            ) : null}

            {!hasNextPage && items.length > 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                You have reached the end.
              </p>
            ) : null}

            <div ref={sentinelRef} className="h-2 w-full" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}
