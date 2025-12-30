import type { AlgoliaUserObject } from "./server/mapUsersToAlgoliaObjects";

export type AlgoliaHighlightFragment = {
  value: string;
  matchLevel: "none" | "partial" | "full";
  matchedWords: string[];
  fullyHighlighted?: boolean;
};

export type UserSearchHit = AlgoliaUserObject & {
  _highlightResult?: {
    username?: AlgoliaHighlightFragment;
    name?: AlgoliaHighlightFragment;
    bio?: AlgoliaHighlightFragment;
  };
};

export type UserSearchResultSet = {
  hits: UserSearchHit[];
  total: number;
};
