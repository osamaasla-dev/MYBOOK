"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchUserSearchSuggestionsApi,
  type UserSearchResponse,
} from "../services/client/userSearchApi";

export type UseUserSearchSuggestionsOptions = {
  query: string;
  enabled?: boolean;
};

const USER_SEARCH_QUERY_KEY = (query: string) =>
  ["search", "users", query] as const;

export function useUserSearchSuggestions({
  query,
  enabled = true,
}: UseUserSearchSuggestionsOptions) {
  const trimmedQuery = query.trim();
  const isEnabled = enabled && Boolean(trimmedQuery);

  return useQuery<UserSearchResponse>({
    queryKey: USER_SEARCH_QUERY_KEY(trimmedQuery),
    queryFn: () => fetchUserSearchSuggestionsApi(trimmedQuery),
    enabled: isEnabled,
    staleTime: 5_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
