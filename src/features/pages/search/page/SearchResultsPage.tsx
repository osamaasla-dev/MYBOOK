"use client";

import { useCallback, useMemo, useRef } from "react";

import { QueryError, QueryLoading } from "@/components";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useUserSearchResults } from "@/features/pages/search/hooks";
import { USER_SEARCH_RESULTS_DEFAULT_LIMIT } from "@/features/pages/search/constants";

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
    <section
      className="bg-secondary/30 px-4 py-6 text-foreground sm:px-6 lg:px-10"
      data-testid="search-results-page"
      aria-label="Search results page"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <header
          className="space-y-2 bg-white px-5 py-4 rounded-xl"
          data-testid="search-results-header"
        >
          <p
            className="text-sm uppercase tracking-[0.35em] text-muted-foreground"
            data-testid="search-results-subtitle"
          >
            People directory
          </p>
          <h1
            className="text-3xl font-extrabold text-primary"
            data-testid="search-results-title"
          >
            Search results
          </h1>
          {query ? (
            <p
              className="text-base text-muted-foreground"
              data-testid="search-results-summary"
            >
              Showing{" "}
              <span
                className="font-semibold text-foreground"
                data-testid="search-results-count"
              >
                ({resultsSummary}) {resultsLabel}
              </span>{" "}
              for{" "}
              <span
                className="font-semibold text-foreground"
                data-testid="search-results-query"
              >
                &quot;{query}&quot;
              </span>
            </p>
          ) : (
            <p
              className="text-base text-muted-foreground"
              data-testid="search-results-empty-message"
            >
              Type a name from the navbar search bar to see matching people.
            </p>
          )}
        </header>

        {!query ? (
          <div
            className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-10 text-center text-muted-foreground"
            data-testid="search-results-prompt"
            role="status"
            aria-live="polite"
          >
            Enter a search term above to explore the community.
          </div>
        ) : (
          <div
            className="space-y-4"
            role="region"
            aria-live="polite"
            aria-busy={isLoading || isFetchingNextPage}
            aria-label="Search results list"
            data-testid="search-results-region"
          >
            {isLoading && !items.length ? (
              <QueryLoading
                message="Searching for people..."
                data-testid="search-results-loading"
              />
            ) : null}

            {isError ? (
              <QueryError
                message={error?.message}
                onRetry={() => {
                  void refetch();
                }}
                data-testid="search-results-error"
              />
            ) : null}

            {showEmptyState ? (
              <div
                className="rounded-3xl bg-card px-6 py-16 text-center text-muted-foreground"
                data-testid="search-results-empty"
                role="status"
                aria-live="polite"
              >
                No people matched your search just yet.
              </div>
            ) : null}

            <ul
              className="space-y-3"
              role="list"
              aria-label="People search results"
              data-testid="search-results-list"
            >
              {items.map((result, index) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  testId="search-result-card"
                  index={index}
                />
              ))}
            </ul>

            {isFetchingNextPage ? (
              <div
                className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-center text-sm text-muted-foreground"
                data-testid="search-results-loading-more"
                role="status"
                aria-live="polite"
              >
                Loading more profiles...
              </div>
            ) : null}

            {!hasNextPage && items.length > 0 ? (
              <p
                className="text-center text-sm text-muted-foreground"
                data-testid="search-results-end"
                role="status"
                aria-live="polite"
              >
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
