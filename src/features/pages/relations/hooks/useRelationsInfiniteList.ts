"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchRelationsPage } from "../services/relationsApi";
import type {
  RelationsListResult,
  RelationListItem,
  RelationTab,
} from "../types";

export type UseRelationsOptions = {
  tab: RelationTab;
  initialLimit?: number;
  enabled?: boolean;
};

export type RelationsQueryData = {
  pages: RelationsListResult[];
  pageParams: Array<string | undefined>;
  items: RelationListItem[];
  hasMore: boolean;
};

export const relationsQueryKey = (tab: RelationTab) =>
  ["relations", { tab }] as const;

export function useRelationsInfiniteList({
  tab,
  initialLimit,
  enabled = true,
}: UseRelationsOptions) {
  const queryKey = useMemo(() => relationsQueryKey(tab), [tab]);

  return useInfiniteQuery<
    RelationsListResult,
    Error,
    RelationsQueryData,
    typeof queryKey
  >({
    queryKey,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      fetchRelationsPage({
        tab,
        cursor: pageParam as string | undefined,
        limit: initialLimit,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams as Array<string | undefined>,
      items: data.pages.flatMap((page) => page.items),
      hasMore:
        data.pages.length > 0
          ? data.pages[data.pages.length - 1].hasNextPage
          : false,
    }),
    refetchOnWindowFocus: true,
  });
}
