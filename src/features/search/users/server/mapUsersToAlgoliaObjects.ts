import type { UserForIndex } from "./fetchUsersForIndex";

export type AlgoliaUserObject = {
  objectID: string;
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  joinedAtTs: number;
  searchableContent: string;
  searchTokens: string[];
};

const MIN_SUBSTRING_LENGTH = 1;
const MAX_SUBSTRING_LENGTH = 15;
const MAX_BIO_LENGTH = 160;

const WORD_SPLIT_REGEX = /[^a-zA-Z0-9\u0600-\u06FF]+/;

function tokenizeSource(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .toLowerCase()
    .slice(0, MAX_BIO_LENGTH)
    .split(WORD_SPLIT_REGEX)
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildSubstringTokens(word: string): string[] {
  const tokens: string[] = [];
  const normalized = word.trim();
  for (let start = 0; start < normalized.length; start++) {
    for (
      let end = start + MIN_SUBSTRING_LENGTH;
      end <= normalized.length && end - start <= MAX_SUBSTRING_LENGTH;
      end++
    ) {
      tokens.push(normalized.slice(start, end));
    }
  }
  return tokens;
}

function buildSearchTokens(...sources: Array<string | null | undefined>) {
  const uniqueTokens = new Set<string>();

  sources.forEach((source) => {
    tokenizeSource(source).forEach((token) => {
      uniqueTokens.add(token);
      buildSubstringTokens(token).forEach((subToken) =>
        uniqueTokens.add(subToken)
      );
    });
  });

  return Array.from(uniqueTokens);
}

export function mapUsersToAlgoliaObjects(
  users: UserForIndex[]
): AlgoliaUserObject[] {
  return users.map((user) => {
    const joinedAtTs = Math.floor(new Date(user.createdAt).getTime() / 1000);
    const searchTokens = buildSearchTokens(
      user.username,
      user.name,
      user.bio ?? ""
    );
    const searchableContent = [
      user.username,
      user.name ?? "",
      user.bio ?? "",
      ...searchTokens,
    ]
      .map((value) => value?.toString().trim())
      .filter(Boolean)
      .join(" ");

    return {
      objectID: user.id,
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isPrivate: user.isPrivate,
      isVerified: user.isVerified,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      friendsCount: user.friendsCount,
      joinedAtTs,
      searchableContent,
      searchTokens,
    };
  });
}
