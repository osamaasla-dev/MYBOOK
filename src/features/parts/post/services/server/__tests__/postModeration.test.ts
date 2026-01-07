import { moderatePostContent } from "../postModeration";
import { apiResponse } from "@/lib/apiResponse";
import { moderationMessages } from "@/lib/messages";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
  moderateText,
  moderateImage,
  moderateVideo,
} from "@/features/parts/moderation/services/server";
import type { CreatePostInput } from "../../../schemas";
import type { Logger } from "pino";

jest.mock("@/lib/apiResponse", () => ({
  apiResponse: jest.fn(),
}));

jest.mock("@/lib/messages", () => ({
  moderationMessages: {
    textBlocked: "text-blocked",
    mediaBlocked: "media-blocked",
    missingKey: "missing-key",
    rateLimited: "rate-limited",
    failed: "moderation-failed",
  },
}));

jest.mock("@/features/parts/moderation/services/server", () => ({
  MissingModerationAPIKeyError: class extends Error {},
  ModerationProviderError: class extends Error {
    constructor(public status: number, public details: string) {
      super(details);
    }
  },
  moderateText: jest.fn(),
  moderateImage: jest.fn(),
  moderateVideo: jest.fn(),
}));

describe("moderatePostContent", () => {
  const baseParams = {
    userId: "user-123",
    requestId: "req-1",
    log: {
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger,
  };

  const mockedApiResponse = apiResponse as jest.Mock;
  const mockedModerateText = moderateText as jest.Mock;
  const mockedModerateImage = moderateImage as jest.Mock;
  const mockedModerateVideo = moderateVideo as jest.Mock;
  const mockCleanupMedia = jest.fn();

  const createMockApiResponse = (status: number) =>
    ({
      status,
      headers: new Headers(),
    } as unknown as ReturnType<typeof apiResponse>);

  beforeEach(() => {
    jest.clearAllMocks();
    (baseParams.log.warn as jest.Mock).mockReset?.();
    (baseParams.log.error as jest.Mock).mockReset?.();
    mockCleanupMedia.mockReset();
  });

  it("approves post with no content and no media", async () => {
    const result = await moderatePostContent({
      ...baseParams,
      cleanupMedia: mockCleanupMedia,
    });

    expect(result).toEqual({ ok: true });
    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });

  it("approves post with approved text content", async () => {
    mockedModerateText.mockResolvedValue({ status: "approve" });

    const result = await moderatePostContent({
      ...baseParams,
      content: "This is safe content",
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateText).toHaveBeenCalledWith(
      "This is safe content",
      "post"
    );
    expect(result).toEqual({ ok: true });
    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });

  it("rejects post with blocked text content", async () => {
    mockedModerateText.mockResolvedValue({ status: "reject" });
    mockedApiResponse.mockReturnValue(createMockApiResponse(422));

    const result = await moderatePostContent({
      ...baseParams,
      content: "This is unsafe content",
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateText).toHaveBeenCalledWith(
      "This is unsafe content",
      "post"
    );
    expect(baseParams.log.warn).toHaveBeenCalledWith(
      { userId: baseParams.userId },
      "Post text blocked"
    );
    expect(mockCleanupMedia).toHaveBeenCalledWith("create-text-moderation");
    expect(mockedApiResponse).toHaveBeenCalledWith(
      false,
      null,
      moderationMessages.textBlocked,
      422,
      baseParams.requestId
    );
    expect(result).toEqual({
      ok: false,
      response: { status: 422, headers: expect.any(Headers) },
    });
  });

  it("approves post with approved image media", async () => {
    mockedModerateImage.mockResolvedValue({ status: "approve" });

    const media: CreatePostInput["media"] = [
      {
        type: "image",
        url: "https://example.com/image.jpg",
        publicId: "cld-1",
      },
    ];

    const result = await moderatePostContent({
      ...baseParams,
      media,
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateImage).toHaveBeenCalledWith(
      "https://example.com/image.jpg",
      "post"
    );
    expect(result).toEqual({ ok: true });
    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });

  it("approves post with approved video media", async () => {
    mockedModerateVideo.mockResolvedValue({ status: "approve" });

    const media: CreatePostInput["media"] = [
      {
        type: "video",
        url: "https://example.com/video.mp4",
        publicId: "cld-1",
      },
    ];

    const result = await moderatePostContent({
      ...baseParams,
      media,
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateVideo).toHaveBeenCalledWith(
      "https://example.com/video.mp4",
      "post"
    );
    expect(result).toEqual({ ok: true });
    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });

  it("rejects post with blocked image media", async () => {
    mockedModerateImage.mockResolvedValue({ status: "reject" });
    mockedApiResponse.mockReturnValue(createMockApiResponse(422));

    const media: CreatePostInput["media"] = [
      {
        type: "image",
        url: "https://example.com/bad-image.jpg",
        publicId: "cld-1",
      },
    ];

    const result = await moderatePostContent({
      ...baseParams,
      media,
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateImage).toHaveBeenCalledWith(
      "https://example.com/bad-image.jpg",
      "post"
    );
    expect(baseParams.log.warn).toHaveBeenCalledWith(
      {
        userId: baseParams.userId,
        mediaType: "image",
        url: "https://example.com/bad-image.jpg",
      },
      "Post media blocked"
    );
    expect(mockCleanupMedia).toHaveBeenCalledWith("create-media-moderation");
    expect(mockedApiResponse).toHaveBeenCalledWith(
      false,
      null,
      moderationMessages.mediaBlocked,
      422,
      baseParams.requestId
    );
    expect(result).toEqual({
      ok: false,
      response: { status: 422, headers: expect.any(Headers) },
    });
  });

  it("rejects post with blocked video media", async () => {
    mockedModerateVideo.mockResolvedValue({ status: "reject" });
    mockedApiResponse.mockReturnValue(createMockApiResponse(422));

    const media: CreatePostInput["media"] = [
      {
        type: "video",
        url: "https://example.com/bad-video.mp4",
        publicId: "cld-1",
      },
    ];

    const result = await moderatePostContent({
      ...baseParams,
      media,
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateVideo).toHaveBeenCalledWith(
      "https://example.com/bad-video.mp4",
      "post"
    );
    expect(baseParams.log.warn).toHaveBeenCalledWith(
      {
        userId: baseParams.userId,
        mediaType: "video",
        url: "https://example.com/bad-video.mp4",
      },
      "Post media blocked"
    );
    expect(mockCleanupMedia).toHaveBeenCalledWith("create-media-moderation");
    expect(result).toEqual({
      ok: false,
      response: { status: 422, headers: expect.any(Headers) },
    });
  });

  it("handles multiple media items and rejects on first violation", async () => {
    mockedModerateImage.mockResolvedValue({ status: "approve" });
    mockedModerateVideo.mockResolvedValue({ status: "reject" });
    mockedApiResponse.mockReturnValue(createMockApiResponse(422));

    const media: CreatePostInput["media"] = [
      {
        type: "image",
        url: "https://example.com/good-image.jpg",
        publicId: "cld-1",
      },
      {
        type: "video",
        url: "https://example.com/bad-video.mp4",
        publicId: "cld-2",
      },
    ];

    const result = await moderatePostContent({
      ...baseParams,
      media,
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateImage).toHaveBeenCalledWith(
      "https://example.com/good-image.jpg",
      "post"
    );
    expect(mockedModerateVideo).toHaveBeenCalledWith(
      "https://example.com/bad-video.mp4",
      "post"
    );
    expect(mockCleanupMedia).toHaveBeenCalledWith("create-media-moderation");
    expect(result).toEqual({
      ok: false,
      response: { status: 422, headers: expect.any(Headers) },
    });
  });

  it("skips media items without URLs", async () => {
    const media: CreatePostInput["media"] = [
      {
        type: "image",
        publicId: "cld-1",
      },
    ] as never;

    const result = await moderatePostContent({
      ...baseParams,
      media,
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateImage).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });

  it("handles missing moderation API key error", async () => {
    const error = new MissingModerationAPIKeyError();
    mockedModerateText.mockRejectedValue(error);
    mockedApiResponse.mockReturnValue(createMockApiResponse(500));

    const result = await moderatePostContent({
      ...baseParams,
      content: "test content",
      cleanupMedia: mockCleanupMedia,
    });

    expect(baseParams.log.error).toHaveBeenCalledWith(
      "Moderation key missing, rejecting post"
    );
    expect(mockCleanupMedia).toHaveBeenCalledWith(
      "create-missing-moderation-key"
    );
    expect(mockedApiResponse).toHaveBeenCalledWith(
      false,
      null,
      moderationMessages.missingKey,
      500,
      baseParams.requestId
    );
    expect(result).toEqual({
      ok: false,
      response: { status: 500, headers: expect.any(Headers) },
    });
  });

  it("handles moderation provider rate limit error", async () => {
    const error = new ModerationProviderError(429, "Too many requests");
    mockedModerateText.mockRejectedValue(error);
    mockedApiResponse.mockReturnValue(createMockApiResponse(429));

    const result = await moderatePostContent({
      ...baseParams,
      content: "test content",
      cleanupMedia: mockCleanupMedia,
    });

    expect(baseParams.log.warn).toHaveBeenCalledWith(
      { status: 429, details: "Too many requests" },
      "Moderation provider error while creating post"
    );
    expect(mockCleanupMedia).toHaveBeenCalledWith(
      "create-moderation-provider-error"
    );
    expect(mockedApiResponse).toHaveBeenCalledWith(
      false,
      null,
      moderationMessages.rateLimited,
      429,
      baseParams.requestId
    );
    expect(result).toEqual({
      ok: false,
      response: { status: 429, headers: expect.any(Headers) },
    });
  });

  it("handles moderation provider generic error", async () => {
    const error = new ModerationProviderError(500, "Provider error");
    mockedModerateText.mockRejectedValue(error);
    mockedApiResponse.mockReturnValue(createMockApiResponse(500));

    const result = await moderatePostContent({
      ...baseParams,
      content: "test content",
      cleanupMedia: mockCleanupMedia,
    });

    expect(baseParams.log.warn).toHaveBeenCalledWith(
      { status: 500, details: "Provider error" },
      "Moderation provider error while creating post"
    );
    expect(mockCleanupMedia).toHaveBeenCalledWith(
      "create-moderation-provider-error"
    );
    expect(mockedApiResponse).toHaveBeenCalledWith(
      false,
      null,
      moderationMessages.failed,
      500,
      baseParams.requestId
    );
    expect(result).toEqual({
      ok: false,
      response: { status: 500, headers: expect.any(Headers) },
    });
  });

  it("rethrows unexpected errors", async () => {
    const error = new Error("Unexpected error");
    mockedModerateText.mockRejectedValue(error);

    await expect(
      moderatePostContent({
        ...baseParams,
        content: "test content",
        cleanupMedia: mockCleanupMedia,
      })
    ).rejects.toThrow(error);

    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });

  it("handles whitespace-only content correctly", async () => {
    const result = await moderatePostContent({
      ...baseParams,
      content: "   ",
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateText).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });

  it("approves post with both approved text and media", async () => {
    mockedModerateText.mockResolvedValue({ status: "approve" });
    mockedModerateImage.mockResolvedValue({ status: "approve" });

    const media: CreatePostInput["media"] = [
      {
        type: "image",
        url: "https://example.com/image.jpg",
        publicId: "cld-1",
      },
    ];

    const result = await moderatePostContent({
      ...baseParams,
      content: "Safe content",
      media,
      cleanupMedia: mockCleanupMedia,
    });

    expect(mockedModerateText).toHaveBeenCalledWith("Safe content", "post");
    expect(mockedModerateImage).toHaveBeenCalledWith(
      "https://example.com/image.jpg",
      "post"
    );
    expect(result).toEqual({ ok: true });
    expect(mockCleanupMedia).not.toHaveBeenCalled();
  });
});
