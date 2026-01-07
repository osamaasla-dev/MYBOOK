import { parseUploadInputs } from "../parseUploadInputs";
import { MediaUploadError } from "../errors";

// Mock dependencies
jest.mock("../../constants", () => ({
  VALID_RESOURCE_TYPES: new Set(["image", "video", "auto"]),
}));

jest.mock("@/features/types", () => ({
  ModerationContext: {
    post: "post",
    comment: "comment",
    message: "message",
  },
}));

describe("parseUploadInputs", () => {
  const mockUserId = "user-123";
  const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

  describe("successful parsing", () => {
    it("should parse valid FormData with all fields", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("folder", "users/user-123");
      formData.append("folderType", "avatar");
      formData.append("resourceType", "image");
      formData.append("context", "post");

      const result = parseUploadInputs(formData, mockUserId);

      expect(result).toEqual({
        file: mockFile,
        resourceType: "image",
        folderType: "avatar",
        baseFolder: "users/user-123",
        moderationContext: "post",
      });
    });

    it("should use defaults for missing optional fields", () => {
      const formData = new FormData();
      formData.append("file", mockFile);

      const result = parseUploadInputs(formData, mockUserId);

      expect(result).toEqual({
        file: mockFile,
        resourceType: "auto",
        folderType: "generic",
        baseFolder: `users/${mockUserId}`,
        moderationContext: "post",
      });
    });

    it("should handle empty string values as defaults", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("folder", "");
      formData.append("folderType", "");
      formData.append("resourceType", "");
      formData.append("context", "");

      const result = parseUploadInputs(formData, mockUserId);

      expect(result).toEqual({
        file: mockFile,
        resourceType: "auto",
        folderType: "generic",
        baseFolder: `users/${mockUserId}`,
        moderationContext: "post",
      });
    });

    it("should trim whitespace from string values", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("folder", "  users/user-123  ");
      formData.append("folderType", "  avatar  ");
      formData.append("resourceType", "  image  ");
      formData.append("context", "  post  ");

      const result = parseUploadInputs(formData, mockUserId);

      expect(result).toEqual({
        file: mockFile,
        resourceType: "image",
        folderType: "avatar",
        baseFolder: "users/user-123",
        moderationContext: "post",
      });
    });

    it("should handle valid resource types", () => {
      const validTypes = ["image", "video", "auto"];

      validTypes.forEach((resourceType) => {
        const formData = new FormData();
        formData.append("file", mockFile);
        formData.append("resourceType", resourceType);

        const result = parseUploadInputs(formData, mockUserId);

        expect(result.resourceType).toBe(resourceType);
      });
    });

    it("should handle valid moderation contexts", () => {
      const validContexts = ["post", "comment", "message"];

      validContexts.forEach((context) => {
        const formData = new FormData();
        formData.append("file", mockFile);
        formData.append("context", context);

        const result = parseUploadInputs(formData, mockUserId);

        expect(result.moderationContext).toBe(context);
      });
    });
  });

  describe("validation errors", () => {
    it("should throw error when file is missing", () => {
      const formData = new FormData();
      formData.append("folder", "users/user-123");

      expect(() => parseUploadInputs(formData, mockUserId)).toThrow(
        new MediaUploadError("noFile", 400)
      );
    });

    it("should throw error when file is not a File object", () => {
      const formData = new FormData();
      formData.append("file", "not-a-file" as string | Blob);

      expect(() => parseUploadInputs(formData, mockUserId)).toThrow(
        new MediaUploadError("noFile", 400)
      );
    });

    it("should handle invalid resource type by defaulting to auto", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("resourceType", "invalid-type");

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.resourceType).toBe("auto");
    });

    it("should handle case-insensitive resource types", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("resourceType", "IMAGE");

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.resourceType).toBe("image");
    });
  });

  describe("edge cases", () => {
    it("should handle FormData with only file", () => {
      const formData = new FormData();
      formData.append("file", mockFile);

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.file).toBe(mockFile);
      expect(result.resourceType).toBe("auto");
      expect(result.folderType).toBe("generic");
      expect(result.baseFolder).toBe(`users/${mockUserId}`);
      expect(result.moderationContext).toBe("post");
    });

    it("should handle different file types", () => {
      const imageFile = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const videoFile = new File(["video"], "test.mp4", { type: "video/mp4" });

      [imageFile, videoFile].forEach((file) => {
        const formData = new FormData();
        formData.append("file", file);

        const result = parseUploadInputs(formData, mockUserId);

        expect(result.file).toBe(file);
      });
    });

    it("should handle very long folder names", () => {
      const longFolder = "a".repeat(1000);
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("folder", longFolder);

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.baseFolder).toBe(longFolder);
    });

    it("should handle special characters in folder names", () => {
      const specialFolder = "user-123_special-folder";
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("folder", specialFolder);

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.baseFolder).toBe(specialFolder);
    });
  });

  describe("resource type parsing", () => {
    it("should handle null resource type", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      // Simulate null by not appending the field

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.resourceType).toBe("auto");
    });

    it("should handle undefined resource type", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      // Simulate undefined by not appending the field

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.resourceType).toBe("auto");
    });
  });

  describe("moderation context parsing", () => {
    it("should handle null moderation context", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      // Simulate null by not appending the field

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.moderationContext).toBe("post");
    });

    it("should handle undefined moderation context", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      // Simulate undefined by not appending the field

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.moderationContext).toBe("post");
    });

    it("should handle empty moderation context", () => {
      const formData = new FormData();
      formData.append("file", mockFile);
      formData.append("context", "");

      const result = parseUploadInputs(formData, mockUserId);

      expect(result.moderationContext).toBe("post");
    });
  });
});
