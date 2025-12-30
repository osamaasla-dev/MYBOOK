import { algoliasearch, type SearchClient } from "algoliasearch";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "";
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY ?? "";

// Use the lightweight browser client; this exposes `initIndex` on the SearchClient
export const algoliaSearchClient: SearchClient | null =
  appId && apiKey ? algoliasearch(appId, apiKey) : null;
