import { rankPostsForImportantUsersFeed } from "../ranker";
import type { ImportantUserScore } from "@/features/pages/home/utils/posts/user-ranking";

jest.mock("../fetch", () => ({
  fetchPostsForImportantUsers: jest.fn(),
}));

jest.mock("../interactions", () => ({
  createEmptyInteractionFlags: jest.fn(),
  fetchViewerPostInteractions: jest.fn(),
}));

jest.mock("../buckets", () => ({
  extractImportantFreshPosts: jest.fn(),
  extractViewerFreshPosts: jest.fn(),
}));

jest.mock("@/features/pages/home/utils/posts/post-ranking", () => ({
  scorePostCandidate: jest.fn(),
  MAX_POSTS_PER_USER: 3,
  TOP_IMPORTANT_PERCENTILE: 0.1,
}));

const { fetchPostsForImportantUsers } = jest.requireMock("../fetch") as {
  fetchPostsForImportantUsers: jest.Mock;
};

const { createEmptyInteractionFlags, fetchViewerPostInteractions } =
  jest.requireMock("../interactions") as {
    createEmptyInteractionFlags: jest.Mock;
    fetchViewerPostInteractions: jest.Mock;
  };

const { extractImportantFreshPosts, extractViewerFreshPosts } =
  jest.requireMock("../buckets") as {
    extractImportantFreshPosts: jest.Mock;
    extractViewerFreshPosts: jest.Mock;
  };

const { scorePostCandidate } = jest.requireMock(
  "@/features/pages/home/utils/posts/post-ranking"
) as { scorePostCandidate: jest.Mock };

describe("rankPostsForImportantUsersFeed", () => {
  const viewerId = "viewer-1";
  const importantUsers: ImportantUserScore[] = [
    {
      targetUserId: "u-1",
      score: 10,
      interactionWeight: 5,
      decayFactor: 0.9,
      lastInteractionAt: null,
    },
    {
      targetUserId: "u-2",
      score: 3,
      interactionWeight: 2,
      decayFactor: 0.5,
      lastInteractionAt: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    createEmptyInteractionFlags.mockReturnValue({
      hasLiked: false,
      hasCommented: false,
      hasShared: false,
      viewerReaction: null,
    });
  });

  it("returns empty when viewerId missing", async () => {
    const result = await rankPostsForImportantUsersFeed({
      viewerId: "",
      importantUsers,
    });
    expect(result).toEqual({ postsIds: [] });
    expect(fetchPostsForImportantUsers).not.toHaveBeenCalled();
  });

  it("returns empty when fetchPostsForImportantUsers yields no posts", async () => {
    fetchPostsForImportantUsers.mockResolvedValue([]);
    const result = await rankPostsForImportantUsersFeed({
      viewerId,
      importantUsers,
    });
    expect(result).toEqual({ postsIds: [] });
    expect(fetchViewerPostInteractions).not.toHaveBeenCalled();
  });

  it("scores posts, caps per author, and orders buckets", async () => {
    const now = new Date("2025-01-01T00:00:00Z");
    fetchPostsForImportantUsers.mockResolvedValue([
      {
        authorId: "u-1",
        posts: [
          {
            id: "p1",
            authorId: "u-1",
            publishedAt: now,
            reactionsCount: 5,
            commentsCount: 2,
            sharesCount: 1,
            viewCount: 50,
            privacy: {
              visibility: "PUBLIC",
              visibilityPreference: "OVERRIDE",
              effectiveVisibility: "PUBLIC",
            },
            viewerRelationship: {
              isSelf: false,
              isFriend: false,
              isFollower: false,
            },
          },
          {
            id: "p2",
            authorId: "u-1",
            publishedAt: now,
            reactionsCount: 1,
            commentsCount: 0,
            sharesCount: 0,
            viewCount: 10,
            privacy: {
              visibility: "PUBLIC",
              visibilityPreference: "OVERRIDE",
              effectiveVisibility: "PUBLIC",
            },
            viewerRelationship: {
              isSelf: false,
              isFriend: false,
              isFollower: false,
            },
          },
        ],
      },
    ]);

    fetchViewerPostInteractions.mockResolvedValue(new Map());

    scorePostCandidate
      .mockReturnValueOnce({ postId: "p1", finalScore: 90 })
      .mockReturnValueOnce({ postId: "p2", finalScore: 30 });

    extractViewerFreshPosts.mockReturnValue({
      bucket: [{ postId: "p1" }],
      remaining: [{ postId: "p2" }],
    });

    extractImportantFreshPosts.mockReturnValue({
      bucket: [],
      remaining: [{ postId: "p2" }],
    });

    const result = await rankPostsForImportantUsersFeed({
      viewerId,
      importantUsers,
      now,
    });

    expect(fetchPostsForImportantUsers).toHaveBeenCalledWith(importantUsers, {
      viewerId,
      windowDays: undefined,
      perUserLimit: 3,
      maxTotalPosts: undefined,
    });
    expect(scorePostCandidate).toHaveBeenCalledTimes(2);
    expect(extractViewerFreshPosts).toHaveBeenCalled();
    expect(extractImportantFreshPosts).toHaveBeenCalled();
    expect(result).toEqual({ postsIds: ["p1", "p2"] });
  });
});
