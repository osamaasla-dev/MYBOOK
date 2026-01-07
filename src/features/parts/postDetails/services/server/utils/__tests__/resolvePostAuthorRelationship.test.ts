import { resolvePostAuthorRelationship } from "../resolvePostAuthorRelationship";

jest.mock(
  "@/features/pages/home/services/posts/post-ranking/relationships",
  () => ({
    buildViewerRelationshipMap: jest.fn(),
  })
);

import { buildViewerRelationshipMap } from "@/features/pages/home/services/posts/post-ranking/relationships";

const mockBuildViewerRelationshipMap = jest.mocked(buildViewerRelationshipMap);

// Smart factory functions to reduce repetition
const createTestParams = (
  overrides: Partial<{
    viewerId: string | null;
    authorId: string;
  }> = {}
) => ({
  viewerId: "viewer-123",
  authorId: "author-123",
  ...overrides,
});

describe("resolvePostAuthorRelationship", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should return default relationship when no viewer", async () => {
      const params = createTestParams({ viewerId: null });

      const result = await resolvePostAuthorRelationship(params);

      expect(result).toEqual({
        isSelf: false,
        isFriend: false,
        isFollower: false,
      });
      expect(mockBuildViewerRelationshipMap).not.toHaveBeenCalled();
    });

    it("should return self relationship when viewer is author", async () => {
      const params = createTestParams({
        viewerId: "user-123",
        authorId: "user-123",
      });

      const result = await resolvePostAuthorRelationship(params);

      expect(result).toEqual({
        isSelf: true,
        isFriend: false,
        isFollower: false,
      });
      expect(mockBuildViewerRelationshipMap).not.toHaveBeenCalled();
    });

    it("should fetch relationship when viewer and author are different", async () => {
      const params = createTestParams({
        viewerId: "viewer-123",
        authorId: "author-456",
      });
      const relationshipMap = new Map([
        ["author-456", { isFriend: true, isFollower: false, isSelf: false }],
      ]);

      mockBuildViewerRelationshipMap.mockResolvedValue(relationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(mockBuildViewerRelationshipMap).toHaveBeenCalledWith(
        "viewer-123",
        ["author-456"]
      );
      expect(result).toEqual({
        isSelf: false,
        isFriend: true,
        isFollower: false,
      });
    });

    it("should return friend relationship", async () => {
      const params = createTestParams();
      const relationshipMap = new Map([
        ["author-123", { isFriend: true, isFollower: false, isSelf: false }],
      ]);

      mockBuildViewerRelationshipMap.mockResolvedValue(relationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(result).toEqual({
        isSelf: false,
        isFriend: true,
        isFollower: false,
      });
    });

    it("should return follower relationship", async () => {
      const params = createTestParams();
      const relationshipMap = new Map([
        ["author-123", { isFriend: false, isFollower: true, isSelf: false }],
      ]);

      mockBuildViewerRelationshipMap.mockResolvedValue(relationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(result).toEqual({
        isSelf: false,
        isFriend: false,
        isFollower: true,
      });
    });

    it("should return friend and follower relationship", async () => {
      const params = createTestParams();
      const relationshipMap = new Map([
        ["author-123", { isFriend: true, isFollower: true, isSelf: false }],
      ]);

      mockBuildViewerRelationshipMap.mockResolvedValue(relationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(result).toEqual({
        isSelf: false,
        isFriend: true,
        isFollower: true,
      });
    });
  });

  describe("Edge cases", () => {
    it("should return default relationship when author not found in map", async () => {
      const params = createTestParams();
      const emptyRelationshipMap = new Map();

      mockBuildViewerRelationshipMap.mockResolvedValue(emptyRelationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(result).toEqual({
        isSelf: false,
        isFriend: false,
        isFollower: false,
      });
    });

    it("should handle empty relationship data", async () => {
      const params = createTestParams();
      const relationshipMap = new Map([
        ["author-123", { isSelf: false, isFriend: false, isFollower: false }],
      ]);

      mockBuildViewerRelationshipMap.mockResolvedValue(relationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(result).toEqual({
        isSelf: false,
        isFriend: false,
        isFollower: false,
      });
    });

    it("should handle database errors gracefully", async () => {
      const params = createTestParams();
      const dbError = new Error("Database connection failed");

      mockBuildViewerRelationshipMap.mockRejectedValue(dbError);

      await expect(resolvePostAuthorRelationship(params)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle different user IDs", async () => {
      const params = createTestParams({
        viewerId: "user-abc",
        authorId: "user-xyz",
      });
      const relationshipMap = new Map([
        ["user-xyz", { isFriend: false, isFollower: true, isSelf: false }],
      ]);

      mockBuildViewerRelationshipMap.mockResolvedValue(relationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(mockBuildViewerRelationshipMap).toHaveBeenCalledWith("user-abc", [
        "user-xyz",
      ]);
      expect(result).toEqual({
        isSelf: false,
        isFriend: false,
        isFollower: true,
      });
    });

    it("should handle multiple authors in relationship map", async () => {
      const params = createTestParams({
        authorId: "author-789",
      });
      const relationshipMap = new Map([
        ["author-123", { isFriend: true, isFollower: false, isSelf: false }],
        ["author-456", { isFriend: false, isFollower: true, isSelf: false }],
        ["author-789", { isFriend: true, isFollower: true, isSelf: false }],
      ]);

      mockBuildViewerRelationshipMap.mockResolvedValue(relationshipMap);

      const result = await resolvePostAuthorRelationship(params);

      expect(mockBuildViewerRelationshipMap).toHaveBeenCalledWith(
        "viewer-123",
        ["author-789"]
      );
      expect(result).toEqual({
        isSelf: false,
        isFriend: true,
        isFollower: true,
      });
    });
  });
});
