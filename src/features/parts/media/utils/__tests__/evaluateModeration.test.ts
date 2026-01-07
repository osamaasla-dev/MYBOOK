import { evaluateModeration } from "../evaluateModeration";
import type { MediaMetadata } from "../../types/media";

// Mock dependencies
jest.mock("@/features/parts/moderation/utils", () => ({
  decideModerationAction: jest.fn(),
}));

jest.mock("@/features/parts/moderation/services/server", () => ({
  checkImageModeration: jest.fn(),
  checkVideoModeration: jest.fn(),
}));

import { decideModerationAction } from "@/features/parts/moderation/utils";
import {
  checkImageModeration,
  checkVideoModeration,
} from "@/features/parts/moderation/services/server";

const mockDecideModerationAction =
  decideModerationAction as jest.MockedFunction<typeof decideModerationAction>;
const mockCheckImageModeration = checkImageModeration as jest.MockedFunction<
  typeof checkImageModeration
>;
const mockCheckVideoModeration = checkVideoModeration as jest.MockedFunction<
  typeof checkVideoModeration
>;

describe("evaluateModeration", () => {
  const mockImageMetadata: MediaMetadata = {
    publicId: "test-image-id",
    type: "image",
    url: "https://example.com/test.jpg",
    folder: "users/user-123/avatar",
    width: 100,
    height: 100,
    format: "jpg",
    duration: null,
    frames: null,
    frameRate: null,
  };

  const mockVideoMetadata: MediaMetadata = {
    publicId: "test-video-id",
    type: "video",
    url: "https://example.com/test.mp4",
    folder: "users/user-123/video",
    width: 1920,
    height: 1080,
    format: "mp4",
    duration: 30,
    frames: 900,
    frameRate: "30",
  };

  const mockModerationContext = "post" as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("image moderation", () => {
    it("should call checkImageModeration for image metadata", async () => {
      const mockOutcome = {
        context: "post" as const,
        severity: 0.1,
      };
      mockCheckImageModeration.mockResolvedValue(mockOutcome);
      mockDecideModerationAction.mockReturnValue({
        status: "allow",
        severity: 0.1,
        context: "post",
        threshold: 0.5,
      });

      const result = await evaluateModeration(
        mockImageMetadata,
        mockModerationContext
      );

      expect(mockCheckImageModeration).toHaveBeenCalledWith(
        mockImageMetadata.url,
        mockModerationContext
      );
      expect(mockCheckVideoModeration).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: "allow",
        severity: 0.1,
        context: "post",
        threshold: 0.5,
      });
    });

    it("should handle image moderation rejection", async () => {
      const mockOutcome = {
        context: "post" as const,
        severity: 0.9,
      };
      mockCheckImageModeration.mockResolvedValue(mockOutcome);
      mockDecideModerationAction.mockReturnValue({
        status: "reject",
        severity: 0.9,
        context: "post",
        threshold: 0.5,
      });

      const result = await evaluateModeration(
        mockImageMetadata,
        mockModerationContext
      );

      expect(result).toEqual({
        status: "reject",
        severity: 0.9,
        context: "post",
        threshold: 0.5,
      });
    });

    it("should handle image moderation with different contexts", async () => {
      const contexts: Array<
        "post" | "comment" | "message" | "avatar" | "cover" | "bio"
      > = ["post", "comment", "message", "avatar", "cover", "bio"];

      for (const context of contexts) {
        const mockOutcome = {
          context: context,
          severity: 0.1,
        };
        mockCheckImageModeration.mockResolvedValue(mockOutcome);
        mockDecideModerationAction.mockReturnValue({
          status: "allow",
          severity: 0.1,
          context: context,
          threshold: 0.5,
        });

        await evaluateModeration(mockImageMetadata, context);

        expect(mockCheckImageModeration).toHaveBeenCalledWith(
          mockImageMetadata.url,
          context
        );
      }
    });
  });

  describe("video moderation", () => {
    it("should call checkVideoModeration for video metadata", async () => {
      const mockOutcome = {
        context: "post" as const,
        severity: 0.2,
      };
      mockCheckVideoModeration.mockResolvedValue(mockOutcome);
      mockDecideModerationAction.mockReturnValue({
        status: "allow",
        severity: 0.2,
        context: "post",
        threshold: 0.5,
      });

      const result = await evaluateModeration(
        mockVideoMetadata,
        mockModerationContext
      );

      expect(mockCheckVideoModeration).toHaveBeenCalledWith(
        mockVideoMetadata.url,
        mockModerationContext
      );
      expect(mockCheckImageModeration).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: "allow",
        severity: 0.2,
        context: "post",
        threshold: 0.5,
      });
    });

    it("should handle video moderation rejection", async () => {
      const mockOutcome = {
        context: "post" as const,
        severity: 0.8,
      };
      mockCheckVideoModeration.mockResolvedValue(mockOutcome);
      mockDecideModerationAction.mockReturnValue({
        status: "reject",
        severity: 0.8,
        context: "post",
        threshold: 0.5,
      });

      const result = await evaluateModeration(
        mockVideoMetadata,
        mockModerationContext
      );

      expect(result).toEqual({
        status: "reject",
        severity: 0.8,
        context: "post",
        threshold: 0.5,
      });
    });

    it("should handle video moderation with different contexts", async () => {
      const contexts: Array<
        "post" | "comment" | "message" | "avatar" | "cover" | "bio"
      > = ["post", "comment", "message", "avatar", "cover", "bio"];

      for (const context of contexts) {
        const mockOutcome = {
          context: context,
          severity: 0.1,
        };
        mockCheckVideoModeration.mockResolvedValue(mockOutcome);
        mockDecideModerationAction.mockReturnValue({
          status: "allow",
          severity: 0.1,
          context: context,
          threshold: 0.5,
        });

        await evaluateModeration(mockVideoMetadata, context);

        expect(mockCheckVideoModeration).toHaveBeenCalledWith(
          mockVideoMetadata.url,
          context
        );
      }
    });
  });

  describe("decision making", () => {
    it("should call decideModerationAction with correct parameters", async () => {
      const mockOutcome = {
        context: "post" as const,
        severity: 0.3,
      };
      mockCheckImageModeration.mockResolvedValue(mockOutcome);
      mockDecideModerationAction.mockReturnValue({
        status: "allow",
        severity: 0.3,
        context: "post",
        threshold: 0.5,
      });

      await evaluateModeration(mockImageMetadata, mockModerationContext);

      expect(mockDecideModerationAction).toHaveBeenCalledWith(
        mockOutcome.context,
        mockOutcome.severity
      );
    });

    it("should handle different severity levels", async () => {
      const severityLevels = [0.1, 0.3, 0.5, 0.7, 0.9];

      for (const severity of severityLevels) {
        const mockOutcome = {
          context: "post" as const,
          severity,
        };
        mockCheckImageModeration.mockResolvedValue(mockOutcome);
        mockDecideModerationAction.mockReturnValue({
          status: severity > 0.5 ? "reject" : "allow",
          severity,
          context: "post",
          threshold: 0.5,
        });

        const result = await evaluateModeration(
          mockImageMetadata,
          mockModerationContext
        );

        expect(result.severity).toBe(severity);
        expect(result.status).toBe(severity > 0.5 ? "reject" : "allow");
      }
    });

    it("should handle different context outcomes", async () => {
      const contexts = [
        "post",
        "comment",
        "message",
        "avatar",
        "cover",
        "bio",
      ] as const;

      for (const context of contexts) {
        const mockOutcome = {
          context,
          severity: 0.4,
        };
        mockCheckImageModeration.mockResolvedValue(mockOutcome);
        mockDecideModerationAction.mockReturnValue({
          status: "allow",
          severity: 0.4,
          context,
          threshold: 0.5,
        });

        const result = await evaluateModeration(
          mockImageMetadata,
          mockModerationContext
        );

        expect(result.context).toBe(context);
      }
    });
  });

  describe("error handling", () => {
    it("should handle image moderation errors", async () => {
      const moderationError = new Error("Image moderation failed");
      mockCheckImageModeration.mockRejectedValue(moderationError);

      await expect(
        evaluateModeration(mockImageMetadata, mockModerationContext)
      ).rejects.toThrow(moderationError);

      expect(mockDecideModerationAction).not.toHaveBeenCalled();
    });

    it("should handle video moderation errors", async () => {
      const moderationError = new Error("Video moderation failed");
      mockCheckVideoModeration.mockRejectedValue(moderationError);

      await expect(
        evaluateModeration(mockVideoMetadata, mockModerationContext)
      ).rejects.toThrow(moderationError);

      expect(mockDecideModerationAction).not.toHaveBeenCalled();
    });

    it("should handle decision action errors", async () => {
      const mockOutcome = {
        context: "post" as const,
        severity: 0.1,
      };
      const decisionError = new Error("Decision action failed");
      mockCheckImageModeration.mockResolvedValue(mockOutcome);
      mockDecideModerationAction.mockImplementation(() => {
        throw decisionError;
      });

      await expect(
        evaluateModeration(mockImageMetadata, mockModerationContext)
      ).rejects.toThrow(decisionError);
    });
  });

  describe("edge cases", () => {
    it("should handle unknown media type gracefully", async () => {
      const unknownMetadata = {
        ...mockImageMetadata,
        type: "unknown",
      };

      // Should default to image moderation for unknown types
      const mockOutcome = {
        context: "post" as const,
        severity: 0.1,
      };
      mockCheckImageModeration.mockResolvedValue(mockOutcome);
      mockDecideModerationAction.mockReturnValue({
        status: "allow",
        severity: 0.1,
        context: "post",
        threshold: 0.5,
      });

      const result = await evaluateModeration(
        unknownMetadata,
        mockModerationContext
      );

      expect(mockCheckImageModeration).toHaveBeenCalledWith(
        unknownMetadata.url,
        mockModerationContext
      );
      expect(result).toEqual({
        status: "allow",
        severity: 0.1,
        context: "post",
        threshold: 0.5,
      });
    });

    it("should handle different URL formats", async () => {
      const urls = [
        "https://example.com/image.jpg",
        "https://cdn.example.com/videos/test.mp4",
        "https://storage.cloudinary.com/media/image.webp",
      ];

      for (const url of urls) {
        const metadata = {
          ...mockImageMetadata,
          url,
        };
        const mockOutcome = {
          context: "post" as const,
          severity: 0.1,
        };
        mockCheckImageModeration.mockResolvedValue(mockOutcome);
        mockDecideModerationAction.mockReturnValue({
          status: "allow",
          severity: 0.1,
          context: "post",
          threshold: 0.5,
        });

        await evaluateModeration(metadata, mockModerationContext);

        expect(mockCheckImageModeration).toHaveBeenCalledWith(
          url,
          mockModerationContext
        );
      }
    });
  });
});
