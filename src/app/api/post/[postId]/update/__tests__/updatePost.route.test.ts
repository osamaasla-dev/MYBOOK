import request from "supertest";
import { createTestServer } from "tests/testServer";
import { PUT } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/schemas/ids", () => ({
  validateCuid: jest.fn(),
}));

jest.mock("@/features/parts/post/services/server", () => ({
  updatePost: jest.fn(),
  validatePostPayload: jest.fn(),
  moderatePostContent: jest.fn(),
}));

jest.mock("@/features/pages/home/utils/posts/post-ranking/cache", () => ({
  clearRankedPostsCache: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { checkRateLimit } = jest.requireMock(
  "@/features/parts/ratelimit/services"
) as { checkRateLimit: jest.Mock };

const { validateCuid } = jest.requireMock("@/schemas/ids") as {
  validateCuid: jest.Mock;
};

const { updatePost, validatePostPayload, moderatePostContent } =
  jest.requireMock("@/features/parts/post/services/server") as {
    updatePost: jest.Mock;
    validatePostPayload: jest.Mock;
    moderatePostContent: jest.Mock;
  };

const { clearRankedPostsCache } = jest.requireMock(
  "@/features/pages/home/utils/posts/post-ranking/cache"
) as { clearRankedPostsCache: jest.Mock };

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

const serverFactory = (
  body: Record<string, unknown> = { content: "Updated post" }
) =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const segments = url.pathname.split("/");
      const postId = segments[3];
      const context = {
        params: Promise.resolve({ postId }),
      };
      return PUT(req, context);
    })
  )
    .put("/api/post/clpost123/update")
    .set("content-type", "application/json")
    .send(body);

describe("/api/post/[postId]/update PUT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-update",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    validateCuid.mockReturnValue({
      success: true,
      data: "clpost123validated",
    });
    validatePostPayload.mockResolvedValue({
      ok: true,
      data: { content: "Updated post", media: [] },
      cleanupMedia: jest.fn(),
    });
    moderatePostContent.mockResolvedValue({ ok: true });
    updatePost.mockResolvedValue({ id: "post-1" });
    normalizeError.mockImplementation((err) => err);
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

    const response = await serverFactory();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns rate limit response when user exceeded quota", async () => {
    const rateResponse = apiResponse(false, {}, "Rate limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await serverFactory();

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rate limited",
    });
    expect(validateCuid).not.toHaveBeenCalled();
  });

  it("returns 400 when postId invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await request(
      createTestServer((req: Request) => {
        const context = {
          params: Promise.resolve({ postId: "bad-id" }),
        };
        return PUT(req, context);
      })
    )
      .put("/api/post/bad-id/update")
      .set("content-type", "application/json")
      .send({ content: "Updated post" });

    expect(validateCuid).toHaveBeenCalledWith("bad-id");
    expect(log.warn).toHaveBeenCalledWith(postMessages.invalidPayload);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: postMessages.invalidPayload,
    });
    expect(validatePostPayload).not.toHaveBeenCalled();
  });

  it("returns payload validation response on invalid body", async () => {
    const invalidResponse = apiResponse(
      false,
      null,
      "Invalid payload",
      400,
      "req-invalid-body"
    );
    validatePostPayload.mockResolvedValueOnce({
      ok: false,
      response: invalidResponse,
    });

    const response = await serverFactory({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "Invalid payload",
    });
    expect(moderatePostContent).not.toHaveBeenCalled();
  });

  it("returns moderation response when moderation fails", async () => {
    const moderationResponse = apiResponse(
      false,
      null,
      "Rejected",
      400,
      "req-moderation"
    );
    moderatePostContent.mockResolvedValueOnce({
      ok: false,
      response: moderationResponse,
    });

    const response = await serverFactory();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "Rejected",
    });
    expect(updatePost).not.toHaveBeenCalled();
  });

  it("updates post successfully and clears cache", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const post = { id: "post-1", content: "Updated post" };
    updatePost.mockResolvedValueOnce(post);

    const response = await serverFactory();

    expect(validatePostPayload).toHaveBeenCalled();
    expect(updatePost).toHaveBeenCalled();
    expect(clearRankedPostsCache).toHaveBeenCalledWith(viewer.id);
    expect(log.info).toHaveBeenCalledWith(postMessages.update.success);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: post,
      message: postMessages.update.success,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    updatePost.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      postMessages.update.failed
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
