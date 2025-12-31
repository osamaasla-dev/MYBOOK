"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import {
  fetchUserSearchResultsPage,
  type UserSearchResultsParams,
} from "../services/client/userSearchApi";
import type { UserSearchResult, UserSearchResultsPage } from "../types";

export type UseUserSearchResultsOptions = {
  query: string;
  limit?: number;
  enabled?: boolean;
};

export type UserSearchResultsQueryData = {
  pages: UserSearchResultsPage[];
  pageParams: Array<string | undefined>;
  items: UserSearchResult[];
};

const userSearchResultsQueryKey = (query: string, limit?: number) =>
  ["user-search-results", query, limit] as const;

export function useUserSearchResults({
  query,
  limit,
  enabled = true,
}: UseUserSearchResultsOptions) {
  const trimmedQuery = query.trim();
  const isEnabled = enabled && Boolean(trimmedQuery);

  const queryKey = useMemo(
    () => userSearchResultsQueryKey(trimmedQuery, limit),
    [trimmedQuery, limit]
  );

  return useInfiniteQuery<
    UserSearchResultsPage,
    Error,
    UserSearchResultsQueryData,
    typeof queryKey,
    string | undefined
  >({
    queryKey,
    enabled: isEnabled,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      fetchUserSearchResultsPage({
        query: trimmedQuery,
        cursor: typeof pageParam === "string" ? pageParam : undefined,
        limit,
      } satisfies UserSearchResultsParams),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams as Array<string | undefined>,
      items: data.pages.flatMap((page) => page.items),
    }),
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}
