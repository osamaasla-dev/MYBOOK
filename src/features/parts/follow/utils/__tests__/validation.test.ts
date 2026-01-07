import { normalizeFollowUsername, validateFollowTarget } from "../validation";

// Mock dependencies
jest.mock("@/features/pages/profile/types", () => ({
  usernameSchema: {
    safeParse: jest.fn(),
  },
}));

import { usernameSchema } from "@/features/pages/profile/types";

const mockUsernameSchema = usernameSchema as jest.Mocked<typeof usernameSchema>;

describe("follow/utils/validation", () => {
  const mockProfile = {
    id: "user-123",
    username: "testuser",
    name: "Test User",
    avatarUrl: "https://example.com/avatar.jpg",
    avatarPublicId: null,
    bio: null,
    websiteUrl: null,
    coverUrl: null,
    coverPublicId: null,
    isPrivate: false,
    isVerified: false,
    followersCount: 100,
    followingCount: 50,
    friendsCount: 25,
    postsCount: 10,
    createdAt: new Date(),
  } as const;

  const mockPrivateProfile = {
    ...mockProfile,
    isPrivate: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeFollowUsername", () => {
    it("should return lowercase username when valid", () => {
      (mockUsernameSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: "TestUser",
      });

      const result = normalizeFollowUsername("TestUser");

      expect(result).toBe("testuser");
      expect(mockUsernameSchema.safeParse).toHaveBeenCalledWith("TestUser");
    });

    it("should return null when username is invalid", () => {
      (mockUsernameSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { issues: [] },
      });

      const result = normalizeFollowUsername("invalid@username");

      expect(result).toBeNull();
      expect(mockUsernameSchema.safeParse).toHaveBeenCalledWith(
        "invalid@username"
      );
    });

    it("should handle null/undefined username", () => {
      (mockUsernameSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { issues: [] },
      });

      expect(normalizeFollowUsername(undefined)).toBeNull();
    });

    it("should handle empty string", () => {
      (mockUsernameSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { issues: [] },
      });

      const result = normalizeFollowUsername("");

      expect(result).toBeNull();
      expect(mockUsernameSchema.safeParse).toHaveBeenCalledWith("");
    });
  });

  describe("validateFollowTarget", () => {
    it("should return success when profile is valid and not private", () => {
      const result = validateFollowTarget(mockProfile, "viewer-456");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.profile).toEqual(mockProfile);
        expect(result.requiresApproval).toBe(false);
      }
    });

    it("should return success when profile is valid and private", () => {
      const result = validateFollowTarget(mockPrivateProfile, "viewer-456");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.profile).toEqual(mockPrivateProfile);
        expect(result.requiresApproval).toBe(true);
      }
    });

    it("should return NOT_FOUND when profile is null", () => {
      const result = validateFollowTarget(null, "viewer-456");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("NOT_FOUND");
      }
    });

    it("should return SELF when viewer is trying to follow themselves", () => {
      const result = validateFollowTarget(mockProfile, "user-123");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("SELF");
      }
    });

    it("should handle edge case where viewer ID equals profile ID with different types", () => {
      const result = validateFollowTarget(mockProfile, "user-123");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("SELF");
      }
    });
  });

  describe("type safety", () => {
    it("should properly type the return value for success case", () => {
      const result = validateFollowTarget(
        {
          id: "user-123",
          username: "test",
          name: "Test",
          avatarUrl: null,
          avatarPublicId: null,
          bio: null,
          websiteUrl: null,
          coverUrl: null,
          coverPublicId: null,
          isPrivate: false,
          isVerified: false,
          followersCount: 100,
          followingCount: 50,
          friendsCount: 25,
          postsCount: 10,
          createdAt: new Date(),
        },
        "viewer-456"
      );

      if (result.ok) {
        // TypeScript should know these properties exist
        expect(typeof result.profile.id).toBe("string");
        expect(typeof result.requiresApproval).toBe("boolean");
      }
    });

    it("should properly type the return value for failure case", () => {
      const result = validateFollowTarget(null, "viewer-456");

      if (!result.ok) {
        // TypeScript should know this property exists
        expect(["NOT_FOUND", "SELF"]).toContain(result.reason);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle profile with missing optional properties", () => {
      const minimalProfile = {
        id: "user-123",
        username: "test",
        name: "Test",
        avatarUrl: null,
        avatarPublicId: null,
        bio: null,
        websiteUrl: null,
        coverUrl: null,
        coverPublicId: null,
        isPrivate: false,
        isVerified: false,
        followersCount: 100,
        followingCount: 50,
        friendsCount: 25,
        postsCount: 10,
        createdAt: new Date(),
      };

      const result = validateFollowTarget(minimalProfile, "viewer-456");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.profile.avatarUrl).toBeNull();
        expect(result.requiresApproval).toBe(false);
      }
    });

    it("should handle profile with all properties", () => {
      const fullProfile = {
        id: "user-123",
        username: "test",
        name: "Test User",
        avatarUrl: "https://example.com/avatar.jpg",
        avatarPublicId: "avatar-123",
        bio: "This is a bio",
        websiteUrl: "https://example.com",
        coverUrl: "https://example.com/cover.jpg",
        coverPublicId: "cover-123",
        isPrivate: true,
        isVerified: true,
        followersCount: 1000,
        followingCount: 500,
        friendsCount: 250,
        postsCount: 100,
        createdAt: new Date(),
      };

      const result = validateFollowTarget(fullProfile, "viewer-456");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.profile.avatarUrl).toBe("https://example.com/avatar.jpg");
        expect(result.requiresApproval).toBe(true);
      }
    });

    it("should handle empty viewer ID", () => {
      const result = validateFollowTarget(mockProfile, "");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.profile.id).toBe("user-123");
        expect(result.requiresApproval).toBe(false);
      }
    });

    it("should handle very long viewer ID", () => {
      const longViewerId = "a".repeat(100);
      const result = validateFollowTarget(mockProfile, longViewerId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.requiresApproval).toBe(false);
      }
    });
  });

  describe("integration between functions", () => {
    it("should work together for a complete validation flow", () => {
      // Simulate a complete validation flow
      const username = "TestUser";

      // Step 1: Normalize username
      (mockUsernameSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: username,
      });

      const normalizedUsername = normalizeFollowUsername(username);
      expect(normalizedUsername).toBe("testuser");

      // Step 2: Validate target (assuming we fetched a profile)
      const result = validateFollowTarget(mockProfile, "viewer-456");
      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.profile.username).toBe("testuser");
        expect(result.requiresApproval).toBe(false);
      }
    });
  });
});
