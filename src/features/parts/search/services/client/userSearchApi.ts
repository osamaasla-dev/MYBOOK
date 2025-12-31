import { apiGetR } from "@/lib/api";

import type {
  UserSearchRelationship,
  UserSearchResultsPage,
} from "@/features/parts/search/types";

export type UserSearchSuggestion = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  relationship: UserSearchRelationship;
};

export type UserSearchResponse = {
  hits: UserSearchSuggestion[];
};

export type UserSearchResultsParams = {
  query: string;
  cursor?: string;
  limit?: number;
};

const USER_SEARCH_ENDPOINT = "/search/users";
const USER_SEARCH_RESULTS_ENDPOINT = "/search/users/list";

export async function fetchUserSearchSuggestionsApi(
  query: string
): Promise<UserSearchResponse> {
  const { data } = await apiGetR<UserSearchResponse>(USER_SEARCH_ENDPOINT, {
    params: { query },
  });
  return data;
}

function buildUserSearchResultsQuery(params: UserSearchResultsParams) {
  const trimmedQuery = params.query.trim();

  if (!trimmedQuery) {
    throw new Error("Query is required for fetching search results");
  }

  const searchParams = new URLSearchParams({ query: trimmedQuery });

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  const qs = searchParams.toString();
  return `${USER_SEARCH_RESULTS_ENDPOINT}?${qs}`;
}

export async function fetchUserSearchResultsPage(
  params: UserSearchResultsParams
): Promise<UserSearchResultsPage> {
  const url = buildUserSearchResultsQuery(params);
  const { data } = await apiGetR<UserSearchResultsPage>(url);

  return data;
}
