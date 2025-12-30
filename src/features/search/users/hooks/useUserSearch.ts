"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { searchUsers, type SearchUsersOptions } from "../services/searchUsers";
import type { UserSearchResultSet } from "../types";

type UseUserSearchOptions = SearchUsersOptions & {
  enabled?: boolean;
};

export function useUserSearch(query: string, options?: UseUserSearchOptions) {
  const trimmedQuery = query.trim();

  const { enabled: enabledOverride, ...searchOptions } = options ?? {};
  const enabled = enabledOverride ?? Boolean(trimmedQuery);
  const optionsKey = useMemo(
    () => JSON.stringify(searchOptions),
    [searchOptions]
  );

  return useQuery<UserSearchResultSet, Error>({
    queryKey: ["user-search", trimmedQuery, optionsKey],
    queryFn: () => searchUsers(trimmedQuery, searchOptions),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
