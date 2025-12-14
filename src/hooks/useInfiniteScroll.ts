import { useEffect, type RefObject } from "react";

export type UseInfiniteScrollOptions = {
  containerRef?: RefObject<HTMLElement | null>;
  sentinelRef: RefObject<HTMLElement | null>;
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

    let observer: IntersectionObserver | null = null;
    let rafId: number | null = null;

    const observe = () => {
      const container = containerRef?.current ?? null;
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
          root: container ?? undefined,
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
