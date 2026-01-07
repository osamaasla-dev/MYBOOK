import { PostVisibilityPreference, Visibility } from "@prisma/client";

import { buildFeedVisibilityFilters } from "../visibility";
import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking/types";

// Helper functions for test data creation
function createRelationship(
  overrides: Partial<ViewerRelationshipSnapshot> = {}
): ViewerRelationshipSnapshot {
  return {
    isSelf: false,
    isFriend: false,
    isFollower: false,
    ...overrides,
  };
}

function createTestCase(
  description: string,
  viewerId: string,
  authorIds: string[],
  relations: Record<string, ViewerRelationshipSnapshot>,
  expectedFilterCount: number
) {
  return {
    description,
    viewerId,
    authorIds,
    relations: new Map(Object.entries(relations)),
    expectedFilterCount,
  };
}

describe("buildFeedVisibilityFilters", () => {
  describe("self viewing", () => {
    it("should allow all visibilities for self", () => {
      const testCase = createTestCase(
        "self viewing own posts",
        "viewer1",
        ["author1"],
        { author1: createRelationship({ isSelf: true }) },
        1
      );

      const result = buildFeedVisibilityFilters(testCase);

      expect(result).toHaveLength(testCase.expectedFilterCount);
      expect(result[0]).toEqual({ authorId: "author1" });
    });

    it("should handle multiple authors with mixed self/others", () => {
      const testCase = createTestCase(
        "mixed self and other authors",
        "viewer1",
        ["author1", "author2"],
        {
          author1: createRelationship({ isSelf: true }),
          author2: createRelationship({ isSelf: false }),
        },
        2
      );

      const result = buildFeedVisibilityFilters(testCase);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ authorId: "author1" });
      expect(result[1]).toMatchObject({
        authorId: "author2",
        OR: expect.any(Array),
      });
    });
  });

  describe("relationship-based visibility", () => {
    describe.each([
      {
        relationship: "stranger",
        rel: createRelationship({ isFriend: false, isFollower: false }),
        expectedOverride: [Visibility.PUBLIC],
        expectedDefault: [Visibility.PUBLIC],
      },
      {
        relationship: "friend",
        rel: createRelationship({ isFriend: true, isFollower: false }),
        expectedOverride: [
          Visibility.PUBLIC,
          Visibility.FRIENDS,
          Visibility.FRIENDS_FOLLOWERS,
        ],
        expectedDefault: [
          Visibility.PUBLIC,
          Visibility.FRIENDS,
          Visibility.FRIENDS_FOLLOWERS,
        ],
      },
      {
        relationship: "follower",
        rel: createRelationship({ isFriend: false, isFollower: true }),
        expectedOverride: [Visibility.PUBLIC, Visibility.FRIENDS_FOLLOWERS],
        expectedDefault: [Visibility.PUBLIC, Visibility.FRIENDS_FOLLOWERS],
      },
      {
        relationship: "friend and follower",
        rel: createRelationship({ isFriend: true, isFollower: true }),
        expectedOverride: [
          Visibility.PUBLIC,
          Visibility.FRIENDS,
          Visibility.FRIENDS_FOLLOWERS,
        ],
        expectedDefault: [
          Visibility.PUBLIC,
          Visibility.FRIENDS,
          Visibility.FRIENDS_FOLLOWERS,
        ],
      },
    ])(
      "$relationship relationship",
      ({ rel, expectedOverride, expectedDefault }) => {
        it("should generate correct visibility filters", () => {
          const testCase = createTestCase(
            `${rel.isFriend ? "friend" : ""}${
              rel.isFollower ? " follower" : ""
            }`,
            "viewer1",
            ["author1"],
            { author1: rel },
            1
          );

          const result = buildFeedVisibilityFilters(testCase);

          expect(result).toHaveLength(1);
          const filter = result[0];

          if (filter.OR && Array.isArray(filter.OR)) {
            const overrideClause = filter.OR.find(
              (clause) =>
                clause.visibilityPreference ===
                PostVisibilityPreference.OVERRIDE
            ) as { visibility?: { in: Visibility[] } } | undefined;
            const defaultClause = filter.OR.find(
              (clause) =>
                clause.visibilityPreference ===
                PostVisibilityPreference.ACCOUNT_DEFAULT
            ) as
              | {
                  author?: {
                    privacySetting?: { postsVisibility?: { in: Visibility[] } };
                  };
                }
              | undefined;

            if (overrideClause?.visibility?.in) {
              expect(overrideClause.visibility.in).toEqual(
                expect.arrayContaining(expectedOverride)
              );
            }

            if (defaultClause?.author?.privacySetting?.postsVisibility?.in) {
              expect(
                defaultClause.author.privacySetting.postsVisibility.in
              ).toEqual(expect.arrayContaining(expectedDefault));
            }
          }
        });
      }
    );
  });

  describe("multiple authors", () => {
    it("should handle multiple different relationships", () => {
      const testCase = createTestCase(
        "multiple authors with different relationships",
        "viewer1",
        ["author1", "author2", "author3"],
        {
          author1: createRelationship({ isSelf: true }),
          author2: createRelationship({ isFriend: true }),
          author3: createRelationship({ isFriend: false, isFollower: true }),
        },
        3
      );

      const result = buildFeedVisibilityFilters(testCase);

      expect(result).toHaveLength(3);

      // Self should have simple filter
      expect(result[0]).toEqual({ authorId: "author1" });

      // Friend should have both override and default clauses
      expect(result[1]).toMatchObject({
        authorId: "author2",
        OR: expect.arrayContaining([
          expect.objectContaining({
            visibilityPreference: PostVisibilityPreference.OVERRIDE,
            visibility: { in: expect.any(Array) },
          }),
          expect.objectContaining({
            visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
          }),
        ]),
      });

      // Follower should have both clauses
      expect(result[2]).toMatchObject({
        authorId: "author3",
        OR: expect.arrayContaining([
          expect.objectContaining({
            visibilityPreference: PostVisibilityPreference.OVERRIDE,
            visibility: { in: expect.any(Array) },
          }),
          expect.objectContaining({
            visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
          }),
        ]),
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty author list", () => {
      const testCase = createTestCase(
        "empty author list",
        "viewer1",
        [],
        {},
        0
      );

      const result = buildFeedVisibilityFilters(testCase);

      expect(result).toHaveLength(0);
    });

    it("should handle missing relationship data", () => {
      const testCase = createTestCase(
        "missing relationship data",
        "viewer1",
        ["author1", "author2"],
        {
          // author1 is missing from relations
          author2: createRelationship({ isFriend: true }),
        },
        2
      );

      const result = buildFeedVisibilityFilters(testCase);

      expect(result).toHaveLength(2);

      // Missing relationship should default to stranger
      const author1Filter = result.find((f) => f.authorId === "author1");
      expect(author1Filter).toBeDefined();

      const author2Filter = result.find((f) => f.authorId === "author2");
      expect(author2Filter).toBeDefined();
    });

    it("should handle same viewer and author ID", () => {
      const testCase = createTestCase(
        "same viewer and author ID",
        "viewer1",
        ["viewer1"],
        {}, // No explicit relationship needed
        1
      );

      const result = buildFeedVisibilityFilters(testCase);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ authorId: "viewer1" });
    });
  });

  describe("filter structure validation", () => {
    it("should maintain correct Prisma query structure", () => {
      const testCase = createTestCase(
        "prisma structure validation",
        "viewer1",
        ["author1"],
        { author1: createRelationship({ isFriend: true }) },
        1
      );

      const result = buildFeedVisibilityFilters(testCase);

      expect(result).toHaveLength(1);
      const filter = result[0];

      // Should have authorId
      expect(filter.authorId).toBe("author1");

      // Should have OR clause with proper structure
      expect(filter.OR).toBeDefined();
      expect(Array.isArray(filter.OR)).toBe(true);
      expect(filter.OR).toHaveLength(2);

      // Check override clause structure
      const overrideClause = filter.OR!.find(
        (clause) =>
          clause.visibilityPreference === PostVisibilityPreference.OVERRIDE
      ) as { visibility?: { in: Visibility[] } } | undefined;
      expect(overrideClause).toMatchObject({
        visibilityPreference: PostVisibilityPreference.OVERRIDE,
        visibility: { in: expect.any(Array) },
      });

      // Check default clause structure
      const defaultClause = filter.OR!.find(
        (clause) =>
          clause.visibilityPreference ===
          PostVisibilityPreference.ACCOUNT_DEFAULT
      ) as
        | {
            author?: {
              privacySetting?: { postsVisibility?: { in: Visibility[] } };
            };
          }
        | undefined;
      expect(defaultClause).toMatchObject({
        visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
        author: {
          privacySetting: {
            postsVisibility: { in: expect.any(Array) },
          },
        },
      });
    });
  });
});
