import { moderateCommentContent } from "../commentModeration";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
} from "@/features/parts/moderation/services/server";

jest.mock("@/features/parts/moderation/services/server", () => ({
  moderateText: jest.fn(),
  MissingModerationAPIKeyError: class extends Error {
    constructor() {
      super("Missing moderation API key");
      this.name = "MissingModerationAPIKeyError";
    }
  },
  ModerationProviderError: class extends Error {
    status: number;
    details: string;
    constructor(status: number, details: string) {
      super("Moderation provider error");
      this.name = "ModerationProviderError";
      this.status = status;
      this.details = details;
    }
  },
}));

jest.mock("@/lib/apiResponse", () => ({
  apiResponse: jest.fn(),
}));

jest.mock("@/lib/messages", () => ({
  moderationMessages: {
    textBlocked: "Comment blocked by moderation",
    missingKey: "Moderation service unavailable",
    rateLimited: "Too many requests, please try again later",
    failed: "Moderation service temporarily unavailable",
  },
}));

import { moderateText } from "@/features/parts/moderation/services/server";
import { apiResponse } from "@/lib/apiResponse";
import { moderationMessages } from "@/lib/messages";
import { Logger } from "pino";

const mockModerateText = jest.mocked(moderateText);
const mockApiResponse = jest.mocked(apiResponse);

// Smart factory functions to reduce repetition
const createTestParams = (
  overrides: Partial<{
    content: string;
    userId: string;
    postId: string;
    log: Logger;
    requestId: string;
  }> = {}
) => ({
  content: "This is a test comment",
  userId: "user-123",
  postId: "post-123",
  log: {
    warn: jest.fn(),
    error: jest.fn(),
  },
  requestId: "req-123",
  ...overrides,
});

const createMockDecision = (
  overrides: Partial<{
    status: "approve" | "reject";
    reason?: string;
  }> = {}
) => ({
  status: "approve" as const,
  reason: undefined,
  ...overrides,
});

describe("moderateCommentContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Success cases", () => {
    it("should approve comment when moderation passes", async () => {
      const params = createTestParams();
      const decision = createMockDecision({ status: "approve" });

      mockModerateText.mockResolvedValue(decision as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(mockModerateText).toHaveBeenCalledWith(
        "This is a test comment",
        "comment"
      );
      expect(result).toEqual({ ok: true });
      expect(params?.log.warn).not.toHaveBeenCalled();
    });

    it("should approve comment with different content", async () => {
      const params = createTestParams({
        content: "Great post! Thanks for sharing",
      });
      const decision = createMockDecision({ status: "approve" });

      mockModerateText.mockResolvedValue(decision as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(mockModerateText).toHaveBeenCalledWith(
        "Great post! Thanks for sharing",
        "comment"
      );
      expect(result).toEqual({ ok: true });
    });
  });

  describe("Moderation rejection", () => {
    it("should reject comment when moderation blocks it", async () => {
      const params = createTestParams();
      const decision = createMockDecision({
        status: "reject",
        reason: "Inappropriate content",
      });

      mockModerateText.mockResolvedValue(decision as never);
      mockApiResponse.mockReturnValue({
        success: false,
        data: null,
        message: "Comment blocked by moderation",
        status: 422,
        requestId: "req-123",
      } as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(mockModerateText).toHaveBeenCalledWith(
        "This is a test comment",
        "comment"
      );
      expect(params.log.warn).toHaveBeenCalledWith(
        { postId: "post-123", userId: "user-123" },
        "Comment blocked by moderation"
      );
      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        moderationMessages.textBlocked,
        422,
        "req-123"
      );
      expect(result).toEqual({
        ok: false,
        response: {
          success: false,
          data: null,
          message: "Comment blocked by moderation",
          status: 422,
          requestId: "req-123",
        },
      });
    });
  });

  describe("Error handling", () => {
    it("should handle MissingModerationAPIKeyError", async () => {
      const params = createTestParams();
      const error = new MissingModerationAPIKeyError();

      mockModerateText.mockRejectedValue(error);
      mockApiResponse.mockReturnValue({
        success: false,
        data: null,
        message: "Moderation service unavailable",
        status: 500,
        requestId: "req-123",
      } as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(params.log.error).toHaveBeenCalledWith(
        "Moderation key missing, rejecting comment"
      );
      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        moderationMessages.missingKey,
        500,
        "req-123"
      );
      expect(result).toEqual({
        ok: false,
        response: {
          success: false,
          data: null,
          message: "Moderation service unavailable",
          status: 500,
          requestId: "req-123",
        },
      });
    });

    it("should handle ModerationProviderError with 429 status", async () => {
      const params = createTestParams();
      const error = new ModerationProviderError(429, "Rate limit exceeded");

      mockModerateText.mockRejectedValue(error);
      mockApiResponse.mockReturnValue({
        success: false,
        data: null,
        message: "Too many requests, please try again later",
        status: 429,
        requestId: "req-123",
      } as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(params.log.warn).toHaveBeenCalledWith(
        { status: 429, details: "Rate limit exceeded" },
        "Moderation provider error while adding comment"
      );
      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        moderationMessages.rateLimited,
        429,
        "req-123"
      );
      expect(result).toEqual({
        ok: false,
        response: {
          success: false,
          data: null,
          message: "Too many requests, please try again later",
          status: 429,
          requestId: "req-123",
        },
      });
    });

    it("should handle ModerationProviderError with other status codes", async () => {
      const params = createTestParams();
      const error = new ModerationProviderError(503, "Service unavailable");

      mockModerateText.mockRejectedValue(error);
      mockApiResponse.mockReturnValue({
        success: false,
        data: null,
        message: "Moderation service temporarily unavailable",
        status: 503,
        requestId: "req-123",
      } as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(params.log.warn).toHaveBeenCalledWith(
        { status: 503, details: "Service unavailable" },
        "Moderation provider error while adding comment"
      );
      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        moderationMessages.failed,
        503,
        "req-123"
      );
      expect(result).toEqual({
        ok: false,
        response: {
          success: false,
          data: null,
          message: "Moderation service temporarily unavailable",
          status: 503,
          requestId: "req-123",
        },
      });
    });

    it("should re-throw unexpected errors", async () => {
      const params = createTestParams();
      const unexpectedError = new Error("Unexpected database error");

      mockModerateText.mockRejectedValue(unexpectedError);

      await expect(moderateCommentContent(params as never)).rejects.toThrow(
        "Unexpected database error"
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle empty content", async () => {
      const params = createTestParams({ content: "" });
      const decision = createMockDecision({ status: "approve" });

      mockModerateText.mockResolvedValue(decision as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(mockModerateText).toHaveBeenCalledWith("", "comment");
      expect(result).toEqual({ ok: true });
    });

    it("should handle very long content", async () => {
      const longContent = "a".repeat(10000);
      const params = createTestParams({ content: longContent });
      const decision = createMockDecision({ status: "approve" });

      mockModerateText.mockResolvedValue(decision as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(mockModerateText).toHaveBeenCalledWith(longContent, "comment");
      expect(result).toEqual({ ok: true });
    });

    it("should handle content with special characters", async () => {
      const specialContent =
        "🎉 Great post! @user #hashtag https://example.com";
      const params = createTestParams({ content: specialContent });
      const decision = createMockDecision({ status: "approve" });

      mockModerateText.mockResolvedValue(decision as never);

      const result = await moderateCommentContent({
        ...params,
        log: params.log as Logger,
      });

      expect(mockModerateText).toHaveBeenCalledWith(specialContent, "comment");
      expect(result).toEqual({ ok: true });
    });
  });
});
