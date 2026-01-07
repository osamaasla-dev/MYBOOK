import { moderateProfileContent } from "../profileModeration";
import { apiResponse } from "@/lib/apiResponse";
import profileMessages from "@/lib/messages/profile";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateImage,
  moderateText,
} from "@/features/parts/moderation/services/server";
import type { ModerationDecision } from "@/features/parts/moderation/types/moderationTypes";
import type { Logger } from "pino";

jest.mock("@/lib/apiResponse");
jest.mock("@/features/parts/moderation/services/server");

const mockApiResponse = jest.mocked(apiResponse);
const mockModerateText = jest.mocked(moderateText);
const mockModerateImage = jest.mocked(moderateImage);

// Smart factory functions to reduce repetition
const createTestParams = (
  overrides: Partial<{
    bio: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    userId: string;
    requestId: string;
    cleanupMedia: (reason: string) => Promise<void>;
    log: Logger;
  }> = {}
) => ({
  bio: undefined,
  avatarUrl: null,
  coverUrl: null,
  userId: "user-123",
  requestId: "req-123",
  cleanupMedia: jest.fn().mockResolvedValue(undefined),
  log: {
    warn: jest.fn(),
    error: jest.fn(),
  },
  ...overrides,
});

const createModerationDecision = (
  status: "allow" | "reject",
  context: "bio" | "avatar" | "cover" = "bio"
): ModerationDecision => ({
  status,
  context,
  severity: 1,
  threshold: 0.5,
});

describe("moderateProfileContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should return success when all content is approved", async () => {
      const params = createTestParams({
        bio: "Valid bio content",
        avatarUrl: "https://example.com/avatar.jpg",
        coverUrl: "https://example.com/cover.jpg",
      });

      mockModerateText.mockResolvedValue(
        createModerationDecision("allow", "bio")
      );
      mockModerateImage
        .mockResolvedValueOnce(createModerationDecision("allow", "avatar"))
        .mockResolvedValueOnce(createModerationDecision("allow", "cover"));

      const result = await moderateProfileContent(params as never);

      expect(result).toEqual({ ok: true });
      expect(mockModerateText).toHaveBeenCalledWith("Valid bio content", "bio");
      expect(mockModerateImage).toHaveBeenCalledWith(
        "https://example.com/avatar.jpg",
        "avatar"
      );
      expect(mockModerateImage).toHaveBeenCalledWith(
        "https://example.com/cover.jpg",
        "cover"
      );
      expect(params.cleanupMedia).not.toHaveBeenCalled();
    });

    it("should handle empty bio without moderation", async () => {
      const params = createTestParams({
        bio: "",
        avatarUrl: "https://example.com/avatar.jpg",
      });

      mockModerateImage.mockResolvedValue(createModerationDecision("allow"));

      const result = await moderateProfileContent(params as never);

      expect(result).toEqual({ ok: true });
      expect(mockModerateText).not.toHaveBeenCalled();
      expect(mockModerateImage).toHaveBeenCalledWith(
        "https://example.com/avatar.jpg",
        "avatar"
      );
    });

    it("should handle null/undefined content without moderation", async () => {
      const params = createTestParams({
        bio: undefined,
        avatarUrl: null,
        coverUrl: null,
      });

      const result = await moderateProfileContent(params as never);

      expect(result).toEqual({ ok: true });
      expect(mockModerateText).not.toHaveBeenCalled();
      expect(mockModerateImage).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only bio without moderation", async () => {
      const params = createTestParams({
        bio: "   ",
        avatarUrl: "https://example.com/avatar.jpg",
      });

      mockModerateImage.mockResolvedValue(createModerationDecision("allow"));

      const result = await moderateProfileContent(params as never);

      expect(result).toEqual({ ok: true });
      expect(mockModerateText).not.toHaveBeenCalled();
    });
  });

  describe("Content rejection cases", () => {
    it.each([
      ["bio", "bioBlocked", "profile-bio-moderation"],
      ["avatar", "avatarBlocked", "profile-avatar-moderation"],
      ["cover", "coverBlocked", "profile-cover-moderation"],
    ])(
      "should reject %s when moderation fails",
      async (contentType, messageKey, cleanupReason) => {
        const params = createTestParams({
          bio: contentType === "bio" ? "Inappropriate bio" : "Valid bio",
          avatarUrl:
            contentType === "avatar"
              ? "https://example.com/inappropriate.jpg"
              : contentType === "cover"
              ? "https://example.com/avatar.jpg"
              : null,
          coverUrl:
            contentType === "cover"
              ? "https://example.com/inappropriate-cover.jpg"
              : contentType === "avatar"
              ? "https://example.com/cover.jpg"
              : null,
        });

        // Reset mocks before each test
        jest.clearAllMocks();

        if (contentType === "bio") {
          mockModerateText.mockResolvedValue(
            createModerationDecision("reject")
          );
        } else if (contentType === "avatar") {
          mockModerateText.mockResolvedValue(createModerationDecision("allow"));
          mockModerateImage.mockResolvedValueOnce(
            createModerationDecision("reject")
          );
        } else if (contentType === "cover") {
          mockModerateText.mockResolvedValue(createModerationDecision("allow"));
          mockModerateImage
            .mockResolvedValueOnce(createModerationDecision("allow"))
            .mockResolvedValueOnce(createModerationDecision("reject"));
        }

        const result = await moderateProfileContent(params as never);

        expect(result.ok).toBe(false);
        expect(mockApiResponse).toHaveBeenCalledWith(
          false,
          null,
          profileMessages.update[
            messageKey as keyof typeof profileMessages.update
          ],
          422,
          "req-123"
        );
        expect(params.cleanupMedia).toHaveBeenCalledWith(cleanupReason);
        expect(params.log.warn).toHaveBeenCalled();
      }
    );

    it("should stop at first rejection (bio)", async () => {
      const params = createTestParams({
        bio: "Inappropriate bio",
        avatarUrl: "https://example.com/avatar.jpg",
        coverUrl: "https://example.com/cover.jpg",
      });

      mockModerateText.mockResolvedValue(createModerationDecision("reject"));
      mockModerateImage.mockResolvedValue(createModerationDecision("allow"));

      const result = await moderateProfileContent(params as never);

      expect(result.ok).toBe(false);
      expect(mockModerateText).toHaveBeenCalled();
      expect(mockModerateImage).not.toHaveBeenCalled();
    });
  });

  describe("Error handling cases", () => {
    it("should handle MissingModerationAPIKeyError", async () => {
      const params = createTestParams({
        bio: "Test bio",
      });

      mockModerateText.mockRejectedValue(new MissingModerationAPIKeyError());

      const result = await moderateProfileContent(params as never);

      expect(result.ok).toBe(false);
      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        profileMessages.update.moderationUnavailable,
        500,
        "req-123"
      );
      expect(params.cleanupMedia).toHaveBeenCalledWith(
        "profile-missing-moderation-key"
      );
      expect(params.log.error).toHaveBeenCalledWith(
        "Moderation key missing, rejecting profile update"
      );
    });

    it("should handle ModerationProviderError with 429 status", async () => {
      const params = createTestParams({
        bio: "Test bio",
      });

      const providerError = new ModerationProviderError(
        429,
        "Rate limit",
        "rate_limit"
      );
      mockModerateText.mockRejectedValue(providerError);

      const result = await moderateProfileContent(params as never);

      expect(result.ok).toBe(false);
      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        "Content moderation service error",
        undefined,
        "req-123"
      );
      expect(params.cleanupMedia).toHaveBeenCalledWith(
        "profile-moderation-provider-error"
      );
      expect(params.log.warn).toHaveBeenCalledWith(
        { status: undefined, details: undefined },
        "Moderation provider error while updating profile"
      );
    });

    it("should handle ModerationProviderError with other status", async () => {
      const params = createTestParams({
        bio: "Test bio",
      });

      const providerError = new ModerationProviderError(
        500,
        "Service error",
        "internal_error"
      );
      mockModerateText.mockRejectedValue(providerError);

      const result = await moderateProfileContent(params as never);

      expect(result.ok).toBe(false);
      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        "Content moderation service error",
        undefined,
        "req-123"
      );
      expect(params.cleanupMedia).toHaveBeenCalledWith(
        "profile-moderation-provider-error"
      );
      expect(params.log.warn).toHaveBeenCalledWith(
        { status: undefined, details: undefined },
        "Moderation provider error while updating profile"
      );
    });

    it("should rethrow unexpected errors", async () => {
      const params = createTestParams({
        bio: "Test bio",
      });

      const unexpectedError = new Error("Unexpected error");
      mockModerateText.mockRejectedValue(unexpectedError);

      await expect(moderateProfileContent(params as never)).rejects.toThrow(
        "Unexpected error"
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle different user IDs and request IDs", async () => {
      const params = createTestParams({
        userId: "user-456",
        requestId: "req-456",
        bio: "Test bio",
      });

      mockModerateText.mockResolvedValue(createModerationDecision("allow"));

      const result = await moderateProfileContent(params as never);

      expect(result).toEqual({ ok: true });
      expect(mockModerateText).toHaveBeenCalledWith("Test bio", "bio");
    });

    it("should handle bio with leading/trailing spaces", async () => {
      const params = createTestParams({
        bio: "  Valid bio with spaces  ",
      });

      mockModerateText.mockResolvedValue(createModerationDecision("allow"));

      const result = await moderateProfileContent(params as never);

      expect(result).toEqual({ ok: true });
      expect(mockModerateText).toHaveBeenCalledWith(
        "  Valid bio with spaces  ",
        "bio"
      );
    });

    it("should handle very long bio content", async () => {
      const longBio = "a".repeat(1000);
      const params = createTestParams({
        bio: longBio,
      });

      mockModerateText.mockResolvedValue(createModerationDecision("allow"));

      const result = await moderateProfileContent(params as never);

      expect(result).toEqual({ ok: true });
      expect(mockModerateText).toHaveBeenCalledWith(longBio, "bio");
    });
  });
});
