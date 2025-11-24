import { useEffect } from "react";

export type UseInfiniteScrollOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  sentinelRef: React.RefObject<HTMLElement | null>;
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  threshold?: number | number[];
  enabled?: boolean;
};

export function useInfiniteScroll({
  containerRef,
  sentinelRef,
  hasNextPage,
  isFetching,
  onLoadMore,
  rootMargin = "0px 0px 1px 0px",
  threshold = 0,
  enabled = true,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    if (!enabled || !hasNextPage || isFetching) return;

    const container = containerRef.current;
    const sentinel = sentinelRef.current;

    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // trigger load more if sentinel intersects and conditions met
        if (entry.isIntersecting && !isFetching && hasNextPage) {
          onLoadMore();
        }
      },
      {
        root: container,
        rootMargin,
        threshold,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [
    containerRef,
    sentinelRef,
    hasNextPage,
    isFetching,
    onLoadMore,
    rootMargin,
    threshold,
    enabled,
  ]);
}
