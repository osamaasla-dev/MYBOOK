export type UserSearchRelationship = {
  isFriend: boolean;
  isFollowing: boolean;
};

export type UserSearchResult = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  relationship: UserSearchRelationship;
};

export type UserSearchResultsPage = {
  items: UserSearchResult[];
  nextCursor: string | null;
};

export type RankedUserRow = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  is_friend: number | boolean;
  is_following: number | boolean;
  priority_bucket: number | bigint;
  weight_sort: number | bigint;
  name_sort: string;
};

export type NormalizedRankedUserRow = {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  is_friend: boolean;
  is_following: boolean;
  priority_bucket: number;
  weight_sort: number;
  name_sort: string;
};
