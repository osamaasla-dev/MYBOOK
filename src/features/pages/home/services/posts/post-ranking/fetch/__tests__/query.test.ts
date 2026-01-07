import { queryRecentPosts } from "../query";
import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking/types";
import { Visibility, PostVisibilityPreference } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: { findMany: jest.fn() },
  },
}));

jest.mock("../visibility", () => ({
  buildFeedVisibilityFilters: jest.fn(),
}));

const { prisma } = jest.requireMock("@/lib/prisma") as {
  prisma: { post: { findMany: jest.Mock } };
};

const { buildFeedVisibilityFilters } = jest.requireMock("../visibility") as {
  buildFeedVisibilityFilters: jest.Mock;
};

describe("queryRecentPosts", () => {
  const viewerId = "viewer-1";
  const authorIds = ["author-1", "author-2"];
  const since = new Date("2025-01-01T00:00:00Z");
  const limit = 20;
  const relations: Map<string, ViewerRelationshipSnapshot> = new Map();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty when authorIds empty", async () => {
    const result = await queryRecentPosts({
      authorIds: [],
      since,
      limit,
      viewerId,
      relations,
    });
    expect(result).toEqual([]);
    expect(buildFeedVisibilityFilters).not.toHaveBeenCalled();
  });

  it("returns empty when visibility filters empty", async () => {
    buildFeedVisibilityFilters.mockReturnValue([]);
    const result = await queryRecentPosts({
      authorIds,
      since,
      limit,
      viewerId,
      relations,
    });
    expect(result).toEqual([]);
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it("queries posts and maps author default visibility", async () => {
    buildFeedVisibilityFilters.mockReturnValue([{ visibility: "PUBLIC" }]);
    prisma.post.findMany.mockResolvedValue([
      {
        id: "p1",
        authorId: "author-1",
        publishedAt: new Date(),
        reactionsCount: 5,
        commentsCount: 2,
        sharesCount: 1,
        viewCount: 50,
        visibility: Visibility.PUBLIC,
        visibilityPreference: PostVisibilityPreference.OVERRIDE,
        author: {
          privacySetting: { postsVisibility: Visibility.FRIENDS },
        },
      },
      {
        id: "p2",
        authorId: "author-2",
        publishedAt: new Date(),
        reactionsCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewCount: 0,
        visibility: Visibility.FRIENDS,
        visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
        author: null,
      },
    ]);

    const result = await queryRecentPosts({
      authorIds,
      since,
      limit,
      viewerId,
      relations,
    });

    expect(buildFeedVisibilityFilters).toHaveBeenCalledWith({
      viewerId,
      authorIds,
      relations,
    });
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ visibility: "PUBLIC" }],
          publishedAt: { gte: since },
          isDeleted: false,
        }),
        orderBy: { publishedAt: "desc" },
        take: limit,
      })
    );
    expect(result).toEqual([
      {
        id: "p1",
        authorId: "author-1",
        publishedAt: expect.any(Date),
        reactionsCount: 5,
        commentsCount: 2,
        sharesCount: 1,
        viewCount: 50,
        visibility: Visibility.PUBLIC,
        visibilityPreference: PostVisibilityPreference.OVERRIDE,
        authorDefaultVisibility: Visibility.FRIENDS,
      },
      {
        id: "p2",
        authorId: "author-2",
        publishedAt: expect.any(Date),
        reactionsCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewCount: 0,
        visibility: Visibility.FRIENDS,
        visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
        authorDefaultVisibility: Visibility.PUBLIC,
      },
    ]);
  });
});
