import {
  derivePrivacyState,
  buildProfileSummary,
  buildViewerAwareProfile,
} from "../privacy";
import type {
  ProfileUserRecord,
  ViewerRelations,
  ProfileSummary,
  ProfilePrivacyState,
} from "../../types";
import profileMessages from "@/lib/messages/profile";

// Helper functions for test data creation
const createTestUser = (
  overrides: Partial<ProfileUserRecord> = {}
): ProfileUserRecord => ({
  id: "user-123",
  name: "Test User",
  username: "testuser",
  avatarUrl: "https://example.com/avatar.jpg",
  avatarPublicId: "avatar-123",
  bio: "Test bio",
  websiteUrl: "https://example.com",
  coverUrl: "https://example.com/cover.jpg",
  coverPublicId: "cover-123",
  isPrivate: false,
  isVerified: false,
  followersCount: 100,
  followingCount: 50,
  friendsCount: 25,
  postsCount: 75,
  createdAt: new Date("2023-01-01"),
  ...overrides,
});

const createTestRelations = (
  overrides: Partial<ViewerRelations> = {}
): ViewerRelations => ({
  isSelf: false,
  isFollowing: false,
  isFollower: false,
  isBlocked: false,
  hasPendingFollowRequest: false,
  isFriend: false,
  hasIncomingFriendRequest: false,
  hasOutgoingFriendRequest: false,
  ...overrides,
});

const createExpectedPrivacyState = (
  canViewFullProfile: boolean,
  visibility: "public" | "limited" | "locked",
  restrictions: ProfilePrivacyState["restrictions"]
): ProfilePrivacyState => ({
  canViewFullProfile,
  visibility,
  restrictions,
});

const createExpectedSummary = (
  user: ProfileUserRecord,
  privacy: ProfilePrivacyState,
  overrides: Partial<ProfileSummary> = {}
): ProfileSummary => {
  const isPublic = privacy.visibility === "public";
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: privacy.canViewFullProfile ? user.bio : null,
    websiteUrl: privacy.canViewFullProfile ? user.websiteUrl : null,
    coverUrl: privacy.canViewFullProfile ? user.coverUrl : null,
    isPrivate: user.isPrivate,
    isVerified: user.isVerified,
    followersCount: isPublic ? user.followersCount : 0,
    followingCount: isPublic ? user.followingCount : 0,
    friendsCount: isPublic ? user.friendsCount : 0,
    postsCount: isPublic ? user.postsCount : 0,
    createdAt: user.createdAt,
    visibility: privacy.visibility,
    ...overrides,
  };
};

describe("privacy utils", () => {
  describe("derivePrivacyState", () => {
    it.each([
      {
        name: "blocked user",
        userOverrides: {},
        relationsOverrides: { isBlocked: true },
        expected: createExpectedPrivacyState(false, "locked", {
          reason: "PROFILE_BLOCKED",
          message: profileMessages.BLOCKED_PROFILE_MESSAGE,
        }),
      },
      {
        name: "public profile with no restrictions",
        userOverrides: { isPrivate: false },
        relationsOverrides: {},
        expected: createExpectedPrivacyState(true, "public", null),
      },
      {
        name: "private profile with full access (self)",
        userOverrides: { isPrivate: true },
        relationsOverrides: { isSelf: true },
        expected: createExpectedPrivacyState(true, "public", null),
      },
      {
        name: "private profile with full access (following)",
        userOverrides: { isPrivate: true },
        relationsOverrides: { isFollowing: true },
        expected: createExpectedPrivacyState(true, "public", null),
      },
      {
        name: "private profile with pending follow request",
        userOverrides: { isPrivate: true },
        relationsOverrides: { hasPendingFollowRequest: true },
        expected: createExpectedPrivacyState(false, "locked", {
          reason: "FOLLOW_REQUEST_PENDING",
          message: profileMessages.PENDING_FOLLOW_MESSAGE,
        }),
      },
      {
        name: "private profile with limited access",
        userOverrides: { isPrivate: true },
        relationsOverrides: {},
        expected: createExpectedPrivacyState(false, "limited", {
          reason: "PROFILE_PRIVATE",
          message: profileMessages.PRIVATE_PROFILE_MESSAGE,
        }),
      },
    ])(
      "should return $name",
      ({ userOverrides, relationsOverrides, expected }) => {
        const user = createTestUser(userOverrides);
        const relations = createTestRelations(relationsOverrides);

        const result = derivePrivacyState(user, relations);

        expect(result).toEqual(expected);
      }
    );

    it("should prioritize blocked status over other conditions", () => {
      const user = createTestUser({ isPrivate: true });
      const relations = createTestRelations({
        isBlocked: true,
        isSelf: true,
        isFollowing: true,
      });

      const result = derivePrivacyState(user, relations);

      expect(result).toEqual(
        createExpectedPrivacyState(false, "locked", {
          reason: "PROFILE_BLOCKED",
          message: profileMessages.BLOCKED_PROFILE_MESSAGE,
        })
      );
    });

    it("should prioritize pending follow request over private profile", () => {
      const user = createTestUser({ isPrivate: true });
      const relations = createTestRelations({
        hasPendingFollowRequest: true,
        isFollowing: false,
      });

      const result = derivePrivacyState(user, relations);

      expect(result).toEqual(
        createExpectedPrivacyState(false, "locked", {
          reason: "FOLLOW_REQUEST_PENDING",
          message: profileMessages.PENDING_FOLLOW_MESSAGE,
        })
      );
    });
  });

  describe("buildProfileSummary", () => {
    it.each([
      {
        name: "public profile",
        userOverrides: {},
        privacyState: createExpectedPrivacyState(true, "public", null),
        expectedOverrides: {},
      },
      {
        name: "limited profile",
        userOverrides: {},
        privacyState: createExpectedPrivacyState(false, "limited", {
          reason: "PROFILE_PRIVATE",
          message: profileMessages.PRIVATE_PROFILE_MESSAGE,
        }),
        expectedOverrides: {
          bio: null,
          websiteUrl: null,
          coverUrl: null,
          followersCount: 0,
          followingCount: 0,
          friendsCount: 0,
          postsCount: 0,
        },
      },
      {
        name: "locked profile",
        userOverrides: {},
        privacyState: createExpectedPrivacyState(false, "locked", {
          reason: "PROFILE_BLOCKED",
          message: profileMessages.BLOCKED_PROFILE_MESSAGE,
        }),
        expectedOverrides: {
          bio: null,
          websiteUrl: null,
          coverUrl: null,
          followersCount: 0,
          followingCount: 0,
          friendsCount: 0,
          postsCount: 0,
        },
      },
    ])(
      "should build summary for $name",
      ({ userOverrides, privacyState, expectedOverrides }) => {
        const user = createTestUser(userOverrides);
        const expected = createExpectedSummary(
          user,
          privacyState,
          expectedOverrides
        );

        const result = buildProfileSummary(user, privacyState);

        expect(result).toEqual(expected);
      }
    );

    it("should preserve public fields regardless of privacy", () => {
      const user = createTestUser();
      const privacyState = createExpectedPrivacyState(false, "limited", {
        reason: "PROFILE_PRIVATE",
        message: profileMessages.PRIVATE_PROFILE_MESSAGE,
      });

      const result = buildProfileSummary(user, privacyState);

      // These fields should always be visible
      expect(result.id).toBe(user.id);
      expect(result.name).toBe(user.name);
      expect(result.username).toBe(user.username);
      expect(result.avatarUrl).toBe(user.avatarUrl);
      expect(result.isPrivate).toBe(user.isPrivate);
      expect(result.isVerified).toBe(user.isVerified);
      expect(result.visibility).toBe(privacyState.visibility);
    });
  });

  describe("buildViewerAwareProfile", () => {
    const baseSummary = createTestUser();
    const publicSummary = createExpectedSummary(
      baseSummary,
      createExpectedPrivacyState(true, "public", null)
    );
    const privateSummary = createExpectedSummary(
      baseSummary,
      createExpectedPrivacyState(false, "limited", {
        reason: "PROFILE_PRIVATE",
        message: profileMessages.PRIVATE_PROFILE_MESSAGE,
      })
    );

    it.each([
      {
        name: "self viewing public profile",
        summary: publicSummary,
        isSelf: true,
        expected: publicSummary,
      },
      {
        name: "self viewing private profile",
        summary: privateSummary,
        isSelf: true,
        expected: privateSummary,
      },
      {
        name: "other user viewing public profile",
        summary: publicSummary,
        isSelf: false,
        expected: publicSummary,
      },
      {
        name: "other user viewing private profile",
        summary: privateSummary,
        isSelf: false,
        expected: {
          ...privateSummary,
          websiteUrl: null,
          coverUrl: null,
          followersCount: 0,
          followingCount: 0,
          friendsCount: 0,
          postsCount: 0,
        },
      },
    ])(
      "should build viewer-aware profile for $name",
      ({ summary, isSelf, expected }) => {
        const result = buildViewerAwareProfile(summary, isSelf);

        expect(result).toEqual(expected);
      }
    );

    it("should preserve basic fields for non-self viewers", () => {
      const summary = publicSummary;
      const result = buildViewerAwareProfile(summary, false);

      // These fields should always be preserved
      expect(result.id).toBe(summary.id);
      expect(result.name).toBe(summary.name);
      expect(result.username).toBe(summary.username);
      expect(result.avatarUrl).toBe(summary.avatarUrl);
      expect(result.bio).toBe(summary.bio);
      expect(result.isPrivate).toBe(summary.isPrivate);
      expect(result.isVerified).toBe(summary.isVerified);
      expect(result.visibility).toBe(summary.visibility);
    });
  });
});
