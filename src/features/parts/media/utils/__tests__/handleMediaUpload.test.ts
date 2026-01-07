import { handleMediaUpload } from "../handleMediaUpload";
import type { Logger } from "pino";
import type { UploadApiResponse } from "cloudinary";

// Mock dependencies
jest.mock("../parseUploadInputs", () => ({
  parseUploadInputs: jest.fn(),
}));

jest.mock("../getFileBuffer", () => ({
  getFileBuffer: jest.fn(),
}));

jest.mock("../uploadToCloudinary", () => ({
  uploadToCloudinary: jest.fn(),
}));

jest.mock("../buildMetadata", () => ({
  buildMetadata: jest.fn(),
}));

jest.mock("../evaluateModeration", () => ({
  evaluateModeration: jest.fn(),
}));

jest.mock("../assetLifecycle", () => ({
  promoteMedia: jest.fn(),
  removePendingAsset: jest.fn(),
}));

jest.mock("@/lib/messages/moderation", () => ({
  default: {
    mediaBlocked: "Media blocked due to moderation",
  },
}));

jest.mock("@/lib/apiResponse", () => ({
  apiResponse: jest.fn(),
}));

import { parseUploadInputs } from "../parseUploadInputs";
import { getFileBuffer } from "../getFileBuffer";
import { uploadToCloudinary } from "../uploadToCloudinary";
import { buildMetadata } from "../buildMetadata";
import { evaluateModeration } from "../evaluateModeration";
import { promoteMedia, removePendingAsset } from "../assetLifecycle";
import moderationMessages from "@/lib/messages/moderation";
import { apiResponse } from "@/lib/apiResponse";

const mockParseUploadInputs = parseUploadInputs as jest.MockedFunction<
  typeof parseUploadInputs
>;
const mockGetFileBuffer = getFileBuffer as jest.MockedFunction<
  typeof getFileBuffer
>;
const mockUploadToCloudinary = uploadToCloudinary as jest.MockedFunction<
  typeof uploadToCloudinary
>;
const mockBuildMetadata = buildMetadata as jest.MockedFunction<
  typeof buildMetadata
>;
const mockEvaluateModeration = evaluateModeration as jest.MockedFunction<
  typeof evaluateModeration
>;
const mockPromoteMedia = promoteMedia as jest.MockedFunction<
  typeof promoteMedia
>;
const mockRemovePendingAsset = removePendingAsset as jest.MockedFunction<
  typeof removePendingAsset
>;
const mockApiResponse = apiResponse as jest.MockedFunction<typeof apiResponse>;

describe("handleMediaUpload", () => {
  const mockFormData = new FormData();
  const mockUserId = "user-123";
  const mockLog = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    level: "info" as const,
  } as unknown as Logger;
  const mockRequestId = "request-456";

  const mockInputs = {
    file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
    resourceType: "image" as const,
    folderType: "avatar",
    baseFolder: "users/user-123",
    moderationContext: "post" as const,
  };

  const mockBuffer = Buffer.from("test");
  const mockUploadResult: Partial<UploadApiResponse> = {
    public_id: "test-public-id",
    secure_url: "https://example.com/test.jpg",
    width: 100,
    height: 100,
    format: "jpg",
    resource_type: "image",
    version: 1,
    signature: "test-signature",
    created_at: "2023-01-01T00:00:00Z",
    tags: [],
    bytes: 1000,
    type: "upload",
    etag: "test-etag",
    placeholder: false,
    url: "https://example.com/test.jpg",
    access_mode: "public",
  };

  const mockMetadata = {
    publicId: "test-public-id",
    type: "image",
    url: "https://example.com/test.jpg",
    folder: "users/user-123/pending/avatar",
    width: 100,
    height: 100,
    format: "jpg",
    duration: null,
    frames: null,
    frameRate: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockParseUploadInputs.mockReturnValue(mockInputs);
    mockGetFileBuffer.mockResolvedValue(mockBuffer);
    mockUploadToCloudinary.mockResolvedValue(
      mockUploadResult as UploadApiResponse
    );
    mockBuildMetadata.mockReturnValue(mockMetadata);
    mockEvaluateModeration.mockResolvedValue({
      status: "allow",
      severity: 0.1,
      context: "post" as const,
      threshold: 0.5,
    });
    mockPromoteMedia.mockResolvedValue(mockUploadResult as UploadApiResponse);
    mockApiResponse.mockReturnValue({
      success: false,
      data: null,
      message: "Media blocked due to moderation",
      status: 422,
      requestId: mockRequestId,
    } as unknown as ReturnType<typeof apiResponse>);
  });

  describe("successful upload with approval", () => {
    it("should parse upload inputs", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockParseUploadInputs).toHaveBeenCalledWith(
        mockFormData,
        mockUserId
      );
    });

    it("should get file buffer", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockGetFileBuffer).toHaveBeenCalledWith(mockInputs.file);
    });

    it("should upload to cloudinary", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockUploadToCloudinary).toHaveBeenCalledWith({
        buffer: mockBuffer,
        folder: "users/user-123/pending/avatar",
        resourceType: "image",
      });
    });

    it("should build metadata", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockBuildMetadata).toHaveBeenCalledWith(
        mockUploadResult,
        "users/user-123/pending/avatar"
      );
    });

    it("should evaluate moderation", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockEvaluateModeration).toHaveBeenCalledWith(mockMetadata, "post");
    });

    it("should promote media when approved", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockPromoteMedia).toHaveBeenCalledWith(mockMetadata.publicId);
    });

    it("should return asset payload with moderation info", async () => {
      const result = await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(result).toEqual({
        moderationSeverity: 0.1,
        moderationContext: "post",
        moderationThreshold: 0.5,
        moderationStatus: "allow",
        asset: {
          url: mockUploadResult.secure_url,
          publicId: mockUploadResult.public_id,
          width: mockUploadResult.width,
          height: mockUploadResult.height,
          format: mockUploadResult.format,
          folder: "users/user-123/avatar",
          type: mockUploadResult.resource_type,
          duration: null,
          frames: null,
          frameRate: null,
        },
      });
    });
  });

  describe("upload with rejection", () => {
    beforeEach(() => {
      mockEvaluateModeration.mockResolvedValue({
        status: "reject",
        severity: 0.9,
        context: "post" as const,
        threshold: 0.5,
      });
    });

    it("should remove pending asset when rejected", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockRemovePendingAsset).toHaveBeenCalledWith(
        mockMetadata.publicId,
        mockMetadata.type
      );
    });

    it("should return error response when rejected", async () => {
      const result = await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockApiResponse).toHaveBeenCalledWith(
        false,
        null,
        moderationMessages.mediaBlocked,
        422,
        mockRequestId
      );

      expect(result).toEqual({
        error: {
          success: false,
          data: null,
          message: "Media blocked due to moderation",
          status: 422,
          requestId: mockRequestId,
        },
      });
    });

    it("should not promote media when rejected", async () => {
      await handleMediaUpload({
        formData: mockFormData,
        userId: mockUserId,
        log: mockLog,
        requestId: mockRequestId,
      });

      expect(mockPromoteMedia).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle parse inputs error", async () => {
      const parseError = new Error("Parse error");
      mockParseUploadInputs.mockImplementation(() => {
        throw parseError;
      });

      await expect(
        handleMediaUpload({
          formData: mockFormData,
          userId: mockUserId,
          log: mockLog,
          requestId: mockRequestId,
        })
      ).rejects.toThrow(parseError);
    });

    it("should handle file buffer error", async () => {
      const bufferError = new Error("Buffer error");
      mockGetFileBuffer.mockRejectedValue(bufferError);

      await expect(
        handleMediaUpload({
          formData: mockFormData,
          userId: mockUserId,
          log: mockLog,
          requestId: mockRequestId,
        })
      ).rejects.toThrow(bufferError);
    });

    it("should handle upload error", async () => {
      const uploadError = new Error("Upload error");
      mockUploadToCloudinary.mockRejectedValue(uploadError);

      await expect(
        handleMediaUpload({
          formData: mockFormData,
          userId: mockUserId,
          log: mockLog,
          requestId: mockRequestId,
        })
      ).rejects.toThrow(uploadError);
    });

    it("should handle moderation error", async () => {
      const moderationError = new Error("Moderation error");
      mockEvaluateModeration.mockRejectedValue(moderationError);

      await expect(
        handleMediaUpload({
          formData: mockFormData,
          userId: mockUserId,
          log: mockLog,
          requestId: mockRequestId,
        })
      ).rejects.toThrow(moderationError);
    });

    it("should handle promotion error", async () => {
      const promotionError = new Error("Promotion error");
      mockPromoteMedia.mockRejectedValue(promotionError);

      await expect(
        handleMediaUpload({
          formData: mockFormData,
          userId: mockUserId,
          log: mockLog,
          requestId: mockRequestId,
        })
      ).rejects.toThrow(promotionError);
    });
  });
});
