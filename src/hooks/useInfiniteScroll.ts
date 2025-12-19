import { useEffect, type RefObject } from "react";

export type UseInfiniteScrollOptions = {
  sentinelRef: RefObject<HTMLElement | null>;
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  threshold?: number | number[];
  enabled?: boolean;
  rootRef?: RefObject<HTMLElement | null>;
};

export function useInfiniteScroll({
  sentinelRef,
  hasNextPage,
  isFetching,
  onLoadMore,
  rootMargin = "0px 0px 1px 0px",
  threshold = 0,
  enabled = true,
  rootRef,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    if (!enabled || !hasNextPage) return;

    let observer: IntersectionObserver | null = null;
    let rafId: number | null = null;

    const observe = () => {
      const sentinel = sentinelRef.current;

      if (!sentinel) {
        rafId = requestAnimationFrame(observe);
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !isFetching && hasNextPage) {
            onLoadMore();
          }
        },
        {
          root: rootRef?.current ?? null,
          rootMargin,
          threshold,
        }
      );

      observer.observe(sentinel);
    };

    observe();

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    sentinelRef,
    hasNextPage,
    isFetching,
    onLoadMore,
    rootMargin,
    threshold,
    enabled,
    rootRef,
  ]);
}
