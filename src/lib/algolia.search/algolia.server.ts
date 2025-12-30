// lib/algolia.server.ts
import { algoliasearch } from "algoliasearch";

if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_KEY) {
  throw new Error("ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY must be set in env");
}

export const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY
);
