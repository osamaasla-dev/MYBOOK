import { buildMetadata } from "../buildMetadata";
import type { UploadApiResponse } from "cloudinary";
import type { MediaMetadata } from "../../types/media";

// Mock helper for creating test upload results
const createMockUploadResult = (
  overrides: Partial<UploadApiResponse> = {}
): UploadApiResponse => ({
  public_id: "test-id",
  secure_url: "https://example.com/test.jpg",
  width: 100,
  height: 100,
  format: "jpg",
  resource_type: "image",
  duration: undefined,
  nb_frames: undefined,
  frame_rate: undefined,
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
  original_filename: "test.jpg",
  path: "test/test.jpg",
  asset_id: "test-asset-id",
  display_name: "test.jpg",
  api_key: "test-api-key",
  pages: 1,
  moderation: [],
  access_control: [],
  context: {},
  metadata: {},
  ...overrides,
});

describe("buildMetadata", () => {
  const mockFolder = "users/user-123/avatar";

  describe("image metadata", () => {
    it("should build metadata for image", () => {
      const mockResult = createMockUploadResult({
        public_id: "test-image-id",
        secure_url: "https://example.com/test.jpg",
        width: 100,
        height: 100,
        format: "jpg",
        resource_type: "image",
        duration: undefined,
        nb_frames: undefined,
        frame_rate: undefined,
      });

      const result = buildMetadata(mockResult, mockFolder);

      const expected: MediaMetadata = {
        url: mockResult.secure_url,
        publicId: mockResult.public_id,
        width: mockResult.width,
        height: mockResult.height,
        format: mockResult.format,
        folder: mockFolder,
        type: mockResult.resource_type,
        duration: null,
        frames: null,
        frameRate: null,
      };

      expect(result).toEqual(expected);
    });
  });

  describe("video metadata", () => {
    it("should build metadata for video", () => {
      const mockResult = createMockUploadResult({
        public_id: "test-video-id",
        secure_url: "https://example.com/test.mp4",
        width: 1920,
        height: 1080,
        format: "mp4",
        resource_type: "video",
        duration: 30,
        nb_frames: 900,
        frame_rate: 30,
      });

      const result = buildMetadata(mockResult, mockFolder);

      const expected: MediaMetadata = {
        url: mockResult.secure_url,
        publicId: mockResult.public_id,
        width: mockResult.width,
        height: mockResult.height,
        format: mockResult.format,
        folder: mockFolder,
        type: mockResult.resource_type,
        duration: mockResult.duration,
        frames: mockResult.nb_frames,
        frameRate: mockResult.frame_rate,
      };

      expect(result).toEqual(expected);
    });
  });

  describe("null handling", () => {
    it("should handle null duration", () => {
      const mockResult = createMockUploadResult({
        duration: null,
      });

      const result = buildMetadata(mockResult, mockFolder);

      expect(result.duration).toBeNull();
    });

    it("should handle undefined duration", () => {
      const mockResult = createMockUploadResult();

      const result = buildMetadata(mockResult, mockFolder);

      expect(result.duration).toBeNull();
    });

    it("should handle null frames", () => {
      const mockResult = createMockUploadResult({
        nb_frames: null,
      });

      const result = buildMetadata(mockResult, mockFolder);

      expect(result.frames).toBeNull();
    });

    it("should handle null frame rate", () => {
      const mockResult = createMockUploadResult({
        frame_rate: null,
      });

      const result = buildMetadata(mockResult, mockFolder);

      expect(result.frameRate).toBeNull();
    });
  });

  describe("folder handling", () => {
    it("should use provided folder", () => {
      const mockResult = createMockUploadResult();

      const customFolder = "users/user-456/profile";
      const result = buildMetadata(mockResult, customFolder);

      expect(result.folder).toBe(customFolder);
    });

    it("should handle empty folder", () => {
      const mockResult = createMockUploadResult();

      const result = buildMetadata(mockResult, "");

      expect(result.folder).toBe("");
    });
  });

  describe("resource types", () => {
    it("should handle image resource type", () => {
      const mockResult = createMockUploadResult();

      const result = buildMetadata(mockResult, mockFolder);

      expect(result.type).toBe("image");
    });

    it("should handle video resource type", () => {
      const mockResult = createMockUploadResult({
        resource_type: "video",
        duration: 30,
        nb_frames: 900,
        frame_rate: 30,
      });

      const result = buildMetadata(mockResult, mockFolder);

      expect(result.type).toBe("video");
    });

    it("should handle auto resource type", () => {
      const mockResult = createMockUploadResult({
        resource_type: "auto",
      });

      const result = buildMetadata(mockResult, mockFolder);

      expect(result.type).toBe("auto");
    });
  });
});
