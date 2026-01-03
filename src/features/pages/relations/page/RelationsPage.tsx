"use client";

import { useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { RELATION_TABS, type RelationTab, isRelationTab } from "../types";
import { RelationsSidebarNav, RelationsList } from "../components";
import { useRelationsRealtime, useRelationsInfiniteList } from "../hooks";
import { Suspense } from "react";

function RelationsPageInner() {
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

  const items = data?.items ?? [];

  useInfiniteScroll({
    rootRef: listRef,
    sentinelRef,
    hasNextPage: Boolean(hasNextPage),
    isFetching: isFetchingNextPage,
    onLoadMore: () => fetchNextPage(),
    rootMargin: "0px 0px 300px 0px",
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
    <div
      className="bg-white px-4 pt-4 lg:px-8"
      data-testid="relations-page"
      role="main"
      aria-label="Relations page"
    >
      <header className="space-y-1" data-testid="relations-header">
        <h1
          className="text-2xl font-semibold text-primary"
          data-testid="relations-title"
        >
          Relations
        </h1>
        <p
          className="text-sm text-muted-foreground"
          data-testid="relations-description"
        >
          Review followers, follow requests, and friends in one dashboard.
        </p>
      </header>

      <div
        className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-6 h-[calc(100vh-8rem)]"
        data-testid="relations-layout"
      >
        <RelationsSidebarNav
          value={currentTab}
          onChange={handleTabChange}
          disabled={isFetchingNextPage}
          testId="relations-sidebar-nav"
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
          testId="relations-list"
        />
      </div>
    </div>
  );
}

export function RelationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RelationsPageInner />
    </Suspense>
  );
}
