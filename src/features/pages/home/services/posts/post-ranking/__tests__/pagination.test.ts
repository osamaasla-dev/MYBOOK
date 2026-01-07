import { getRankedFeedPage } from "../pagination";
import type { RankedFeedPage } from "@/features/pages/home/utils/posts/post-ranking";
import type { ImportantUserScore } from "@/features/pages/home/utils/posts/user-ranking";

jest.mock("@/features/pages/home/utils/posts/post-ranking/cache", () => ({
  readRankedPostsCache: jest.fn(),
  writeRankedPostsCache: jest.fn(),
  clearRankedPostsCache: jest.fn(),
}));

jest.mock("../ranker", () => ({
  rankPostsForImportantUsersFeed: jest.fn(),
}));

const { readRankedPostsCache, writeRankedPostsCache, clearRankedPostsCache } =
  jest.requireMock("@/features/pages/home/utils/posts/post-ranking/cache") as {
    readRankedPostsCache: jest.Mock;
    writeRankedPostsCache: jest.Mock;
    clearRankedPostsCache: jest.Mock;
  };

const { rankPostsForImportantUsersFeed } = jest.requireMock("../ranker") as {
  rankPostsForImportantUsersFeed: jest.Mock;
};

const viewerId = "viewer-1";
const importantUsers: ImportantUserScore[] = [
  {
    targetUserId: "u-1",
    score: 42,
    interactionWeight: 10,
    decayFactor: 0.8,
    lastInteractionAt: null,
  },
];

describe("getRankedFeedPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty feed for missing viewerId", async () => {
    const result = await getRankedFeedPage({
      viewerId: "",
      importantUsers,
    });
    expect(result).toEqual<RankedFeedPage>({
      postsIds: [],
      nextCursor: null,
      total: 0,
      storedAt: null,
      cacheHit: false,
    });
    expect(readRankedPostsCache).not.toHaveBeenCalled();
  });

  it("returns cached posts respecting cursor and pageSize", async () => {
    const now = new Date("2025-01-01T00:00:00Z");
    readRankedPostsCache.mockResolvedValue({
      postsIds: ["p1", "p2", "p3"],
      storedAt: now.getTime(),
    });

    const result = await getRankedFeedPage({
      viewerId,
      importantUsers,
      cursor: 1,
      pageSize: 1,
      now,
    });

    expect(rankPostsForImportantUsersFeed).not.toHaveBeenCalled();
    expect(result).toEqual<RankedFeedPage>({
      postsIds: ["p2"],
      nextCursor: 2,
      total: 3,
      storedAt: now.getTime(),
      cacheHit: true,
    });
  });

  it("ranks posts and writes cache when no cached ids exist", async () => {
    const now = new Date("2025-01-01T12:00:00Z");
    readRankedPostsCache.mockResolvedValue(null);
    rankPostsForImportantUsersFeed.mockResolvedValue({
      postsIds: ["p1", "p2", "p3"],
    });

    const result = await getRankedFeedPage({
      viewerId,
      importantUsers,
      now,
    });

    const expectedStoredAt = now.getTime();
    expect(rankPostsForImportantUsersFeed).toHaveBeenCalledWith(
      expect.objectContaining({
        viewerId,
        importantUsers,
        now,
      })
    );
    expect(writeRankedPostsCache).toHaveBeenCalledWith(viewerId, [
      "p1",
      "p2",
      "p3",
    ]);
    expect(result).toEqual<RankedFeedPage>({
      postsIds: ["p1", "p2", "p3"],
      nextCursor: null,
      total: 3,
      storedAt: expectedStoredAt,
      cacheHit: false,
    });
  });

  it("clears cache when ranker returns empty posts", async () => {
    readRankedPostsCache.mockResolvedValue(null);
    rankPostsForImportantUsersFeed.mockResolvedValue({
      postsIds: [],
    });

    const result = await getRankedFeedPage({
      viewerId,
      importantUsers,
    });

    expect(clearRankedPostsCache).toHaveBeenCalledWith(viewerId);
    expect(result).toEqual<RankedFeedPage>({
      postsIds: [],
      nextCursor: null,
      total: 0,
      storedAt: null,
      cacheHit: false,
    });
  });
});
