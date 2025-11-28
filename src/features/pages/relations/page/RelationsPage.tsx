"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

import { RELATION_TABS, type RelationTab, isRelationTab } from "../types";
import { RelationsSidebarNav } from "../components/RelationsSidebarNav";
import { RelationsList } from "../components/RelationsList";
import { useRelationsInfiniteList } from "../hooks/useRelationsInfiniteList";
import { useRelationsRealtime } from "../hooks/useRelationsRealtime";

export function RelationsPage() {
  useRelationsRealtime();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const currentTab: RelationTab = isRelationTab(tabParam)
    ? tabParam
    : RELATION_TABS[0];

  const listRef = useRef<HTMLDivElement | null>(null);
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
  } = useRelationsInfiniteList({ tab: currentTab, initialLimit: 20 });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  useInfiniteScroll({
    containerRef: listRef,
    sentinelRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 400px 0px",
    enabled: Boolean(hasNextPage),
  });

  const handleTabChange = useCallback(
    (nextTab: RelationTab) => {
      if (nextTab === currentTab) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", nextTab);
      const query = params.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [currentTab, pathname, router, searchParams]
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary">Relations</h1>
        <p className="text-sm text-muted-foreground">
          Review followers, follow requests, and friends in one dashboard.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <RelationsSidebarNav
          value={currentTab}
          onChange={handleTabChange}
          disabled={isFetchingNextPage}
        />

        <RelationsList
          items={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error?.message}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onRetry={refetch}
          listRef={listRef}
          sentinelRef={sentinelRef}
        />
      </div>
    </div>
  );
}
