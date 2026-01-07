import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { postMessages, userMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/schemas/ids", () => ({
  validateCuid: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/services/server", () => ({
  getPostDetailsForViewer: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { validateCuid } = jest.requireMock("@/schemas/ids") as {
  validateCuid: jest.Mock;
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { getPostDetailsForViewer } = jest.requireMock(
  "@/features/parts/postDetails/services/server"
) as { getPostDetailsForViewer: jest.Mock };

const { normalizeError } = jest.requireMock("@/lib/http/normalizeError") as {
  normalizeError: jest.Mock;
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const viewer = { id: "viewer-1" };

const serverFactory = () =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const segments = url.pathname.split("/");
      const postId = segments[3];
      const context = {
        params: Promise.resolve({ postId }),
      };
      return GET(req, context);
    })
  );

describe("/api/post/[postId]/details GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-details",
      log: createMockLog(),
    });
    validateCuid.mockReturnValue({ success: true, data: "clpost1234567890" });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    getPostDetailsForViewer.mockResolvedValue({
      post: { postId: "clpost1234567890" },
    });
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when postId invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await serverFactory()
      .get("/api/post/bad-id/details")
      .send();

    expect(validateCuid).toHaveBeenCalledWith("bad-id");
    expect(log.warn).toHaveBeenCalledWith(
      { postId: "bad-id" },
      "Invalid postId parameter for details route"
    );
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: userMessages.invalidParams,
    });
  });

  it("returns session response when validation fails", async () => {
    const sessionResponse = apiResponse(
      false,
      {},
      "unauthorized",
      401,
      "req-auth"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: sessionResponse,
    });

    const response = await serverFactory()
      .get("/api/post/clpost123/details")
      .send();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(getPostDetailsForViewer).not.toHaveBeenCalled();
  });

  it("returns 404 when post not found", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-not-found", log });
    getPostDetailsForViewer.mockResolvedValueOnce(null);

    const response = await serverFactory()
      .get("/api/post/clpost123/details")
      .send();

    expect(log.warn).toHaveBeenCalledWith(
      { postId: "clpost1234567890" },
      postMessages.notFound
    );
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: postMessages.notFound,
    });
  });

  it("returns post details successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const post = {
      postId: "clpost1234567890",
      author: { id: "author-1" },
      publishedAt: new Date().toISOString(),
      content: { text: "Hello", media: [], richText: null, linkPreview: null },
      visibility: "PUBLIC",
      visibilityPreference: "EVERYONE",
      reactionsCount: 1,
      commentsCount: 2,
      sharesCount: 3,
      viewCount: 4,
      interactions: {
        hasLiked: false,
        hasCommented: false,
        hasShared: false,
        viewerReaction: null,
      },
    };
    getPostDetailsForViewer.mockResolvedValueOnce({ post });

    const response = await serverFactory()
      .get("/api/post/clpost123/details")
      .send();

    expect(getPostDetailsForViewer).toHaveBeenCalledWith({
      postId: "clpost1234567890",
      viewerId: viewer.id,
    });
    expect(log.info).toHaveBeenCalledWith(
      { postId: "clpost1234567890", viewerId: viewer.id },
      postMessages.details.fetchSuccess
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { post },
      message: postMessages.details.fetchSuccess,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    getPostDetailsForViewer.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory()
      .get("/api/post/clpost123/details")
      .send();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      postMessages.details.fetchFailed
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
