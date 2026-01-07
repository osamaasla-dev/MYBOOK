import { buildWhereClause } from "../buildWhereClause";
import { Visibility, PostVisibilityPreference } from "@prisma/client";
import type { ViewerRelationshipSnapshot } from "@/features/pages/home/utils/posts/post-ranking/types";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    privacySetting: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockPrivacySettingFindUnique = jest.mocked(
  prisma.privacySetting.findUnique
);

// Smart factory functions to reduce repetition
const createTestParams = (
  overrides: Partial<{
    profileOwnerId: string;
    relationship: ViewerRelationshipSnapshot;
  }> = {}
) => ({
  profileOwnerId: "user-123",
  relationship: undefined,
  ...overrides,
});

const createRelationship = (
  overrides: Partial<ViewerRelationshipSnapshot> = {}
): ViewerRelationshipSnapshot => ({
  isSelf: false,
  isFriend: false,
  isFollower: false,
  ...overrides,
});

const createPrivacySetting = (postsVisibility: Visibility) =>
  ({
    postsVisibility,
  } as never);

// Helper functions to reduce repetition
const createBaseWhereClause = (authorId: string) => ({
  authorId,
  isDeleted: false,
  replyToId: null,
  repostOfId: null,
});

const createExpectedResult = (
  authorId: string,
  overrideVisibilities: { visibility: Visibility }[],
  accountDefaultCondition: boolean
) => ({
  ...createBaseWhereClause(authorId),
  OR: [
    {
      visibilityPreference: PostVisibilityPreference.OVERRIDE,
      OR: overrideVisibilities,
    },
    {
      visibilityPreference: PostVisibilityPreference.ACCOUNT_DEFAULT,
      OR: accountDefaultCondition ? [{}] : [],
    },
  ],
});

const expectPrivacySettingCall = (userId: string) => {
  expect(mockPrivacySettingFindUnique).toHaveBeenCalledWith({
    where: { userId },
    select: { postsVisibility: true },
  });
};

describe("buildWhereClause", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should return base where clause when viewer is profile owner", async () => {
      const params = createTestParams({
        relationship: createRelationship({ isSelf: true }),
      });

      const result = await buildWhereClause(
        params.profileOwnerId,
        params.relationship
      );

      expect(result).toEqual(createBaseWhereClause("user-123"));
      expect(mockPrivacySettingFindUnique).not.toHaveBeenCalled();
    });

    it.each([
      [
        "public account with no relationship",
        Visibility.PUBLIC,
        createRelationship(),
        [{ visibility: Visibility.PUBLIC }],
        true,
      ],
      [
        "friends only account with friend relationship",
        Visibility.FRIENDS,
        createRelationship({ isFriend: true }),
        [
          { visibility: Visibility.PUBLIC },
          { visibility: Visibility.FRIENDS },
          { visibility: Visibility.FRIENDS_FOLLOWERS },
        ],
        true,
      ],
      [
        "friends_followers account with follower relationship",
        Visibility.FRIENDS_FOLLOWERS,
        createRelationship({ isFollower: true }),
        [
          { visibility: Visibility.PUBLIC },
          { visibility: Visibility.FRIENDS_FOLLOWERS },
        ],
        true,
      ],
      [
        "only me account with self relationship",
        Visibility.ONLY_ME,
        createRelationship({ isSelf: true }),
        [], // Should return base where clause
        false,
      ],
    ])(
      "should handle %s",
      async (
        description,
        privacySetting,
        relationship,
        expectedOverrideVisibilities,
        accountDefaultCondition
      ) => {
        const params = createTestParams({ relationship });

        if (privacySetting === Visibility.ONLY_ME && relationship.isSelf) {
          const result = await buildWhereClause(
            params.profileOwnerId,
            params.relationship
          );
          expect(result).toEqual(createBaseWhereClause("user-123"));
          expect(mockPrivacySettingFindUnique).not.toHaveBeenCalled();
          return;
        }

        mockPrivacySettingFindUnique.mockResolvedValue(
          createPrivacySetting(privacySetting)
        );

        const result = await buildWhereClause(
          params.profileOwnerId,
          params.relationship
        );

        expectPrivacySettingCall("user-123");
        expect(result).toEqual(
          createExpectedResult(
            "user-123",
            expectedOverrideVisibilities,
            accountDefaultCondition
          )
        );
      }
    );
  });

  describe("Privacy settings combinations", () => {
    it.each([
      [
        "friends account without friend",
        Visibility.FRIENDS,
        createRelationship(),
        [{ visibility: Visibility.PUBLIC }],
        false, // Special case: friends account without friend
      ],
      [
        "friends_followers account with friend",
        Visibility.FRIENDS_FOLLOWERS,
        createRelationship({ isFriend: true }),
        [
          { visibility: Visibility.PUBLIC },
          { visibility: Visibility.FRIENDS },
          { visibility: Visibility.FRIENDS_FOLLOWERS },
        ],
        true,
      ],
      [
        "friends_followers account with follower",
        Visibility.FRIENDS_FOLLOWERS,
        createRelationship({ isFollower: true }),
        [
          { visibility: Visibility.PUBLIC },
          { visibility: Visibility.FRIENDS_FOLLOWERS },
        ],
        true,
      ],
      [
        "friends_followers account with both",
        Visibility.FRIENDS_FOLLOWERS,
        createRelationship({ isFriend: true, isFollower: true }),
        [
          { visibility: Visibility.PUBLIC },
          { visibility: Visibility.FRIENDS },
          { visibility: Visibility.FRIENDS_FOLLOWERS },
        ],
        true,
      ],
    ])(
      "should handle %s correctly",
      async (
        description,
        privacySetting,
        relationship,
        expectedOverrideVisibilities,
        accountDefaultCondition
      ) => {
        const params = createTestParams({ relationship });

        mockPrivacySettingFindUnique.mockResolvedValue(
          createPrivacySetting(privacySetting)
        );

        const result = await buildWhereClause(
          params.profileOwnerId,
          params.relationship
        );

        expectPrivacySettingCall("user-123");

        // Check OVERRIDE section
        const overrideSection =
          "OR" in result
            ? result.OR?.find(
                (section: {
                  visibilityPreference: PostVisibilityPreference;
                  OR: unknown[];
                }) =>
                  section.visibilityPreference ===
                  PostVisibilityPreference.OVERRIDE
              )
            : undefined;
        expect(overrideSection?.OR).toEqual(expectedOverrideVisibilities);

        // Check ACCOUNT_DEFAULT section
        const accountDefaultSection =
          "OR" in result
            ? result.OR?.find(
                (section: {
                  visibilityPreference: PostVisibilityPreference;
                  OR: unknown[];
                }) =>
                  section.visibilityPreference ===
                  PostVisibilityPreference.ACCOUNT_DEFAULT
              )
            : undefined;

        // Special handling for friends account without friend
        if (privacySetting === Visibility.FRIENDS && !relationship.isFriend) {
          expect(accountDefaultSection?.OR).toEqual([]);
        } else {
          expect(accountDefaultSection?.OR).toEqual(
            accountDefaultCondition ? [{}] : []
          );
        }
      }
    );
  });

  describe("Edge cases", () => {
    it.each([
      [
        "null privacy setting",
        null,
        undefined,
        createExpectedResult(
          "user-123",
          [{ visibility: Visibility.PUBLIC }],
          false
        ),
      ],
      [
        "undefined relationship",
        createPrivacySetting(Visibility.PUBLIC),
        undefined,
        createExpectedResult(
          "user-123",
          [{ visibility: Visibility.PUBLIC }],
          true
        ),
      ],
    ])(
      "should handle %s",
      async (description, privacySetting, relationship, expectedResult) => {
        const params = createTestParams({ relationship });

        mockPrivacySettingFindUnique.mockResolvedValue(privacySetting);

        const result = await buildWhereClause(
          params.profileOwnerId,
          params.relationship
        );

        if (privacySetting !== null) {
          expectPrivacySettingCall("user-123");
        }

        if (relationship === undefined) {
          expect("OR" in result && result.OR?.[0].OR).toEqual([
            { visibility: Visibility.PUBLIC },
          ]);
        } else {
          expect(result).toEqual(expectedResult);
        }
      }
    );

    it("should handle database errors", async () => {
      const params = createTestParams();
      const dbError = new Error("Database connection failed");

      mockPrivacySettingFindUnique.mockRejectedValue(dbError);

      await expect(
        buildWhereClause(params.profileOwnerId, params.relationship)
      ).rejects.toThrow("Database connection failed");
    });

    it("should handle different user IDs", async () => {
      const params = createTestParams({
        profileOwnerId: "user-456",
        relationship: createRelationship({ isFriend: true }),
      });
      mockPrivacySettingFindUnique.mockResolvedValue(
        createPrivacySetting(Visibility.FRIENDS)
      );

      const result = await buildWhereClause(
        params.profileOwnerId,
        params.relationship
      );

      expect(result.authorId).toBe("user-456");
      expectPrivacySettingCall("user-456");
    });
  });
});
