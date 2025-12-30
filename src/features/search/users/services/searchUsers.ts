"use client";

import { algoliaSearchClient } from "@/lib/algolia.search/algolia.client";
import { ALGOLIA_INDEX_USERS } from "@/lib/algolia.search/constants";
import type {
  UserSearchHit,
  UserSearchResultSet,
} from "@/features/search/users/types";

export type SearchUsersOptions = {
  hitsPerPage?: number;
  highlightAttributes?: string[];
  highlightPreTag?: string;
  highlightPostTag?: string;
};

export async function searchUsers(
  query: string,
  options?: SearchUsersOptions
): Promise<UserSearchResultSet> {
  const trimmed = query.trim();
  if (!trimmed) return { hits: [], total: 0 };

  const {
    hitsPerPage = 20,
    highlightAttributes = ["name", "username", "bio"],
    highlightPreTag = '<mark data-highlight="true">',
    highlightPostTag = "</mark>",
  } = options ?? {};

  if (!algoliaSearchClient) {
    throw new Error(
      "Algolia search client is not configured. Ensure NEXT_PUBLIC_ALGOLIA_* env vars are set."
    );
  }

  const response = await algoliaSearchClient.searchSingleIndex<UserSearchHit>({
    indexName: ALGOLIA_INDEX_USERS,
    searchParams: {
      query: trimmed,
      hitsPerPage,
      attributesToHighlight: highlightAttributes,
      highlightPreTag,
      highlightPostTag,
    },
  });

  return {
    hits: response.hits ?? [],
    total: typeof response.nbHits === "number" ? response.nbHits : 0,
  };
}
