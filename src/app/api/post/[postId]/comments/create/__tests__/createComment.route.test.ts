import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { commentMessages, genericMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/schemas/ids", () => ({
  validateCuid: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/utils/server/comments", () => ({
  parseCreateCommentPayload: jest.fn(),
  isCommentRouteError: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/services/server", () => ({
  processCommentCreation: jest.fn(),
  moderateCommentContent: jest.fn(),
}));

jest.mock(
  "@/features/parts/postDetails/services/server/comment/validateReply",
  () => ({
    validateReplyCreation: jest.fn(),
  })
);

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

const { checkRateLimit } = jest.requireMock(
  "@/features/parts/ratelimit/services"
) as {
  checkRateLimit: jest.Mock;
};

const { parseCreateCommentPayload, isCommentRouteError } = jest.requireMock(
  "@/features/parts/postDetails/utils/server/comments"
) as {
  parseCreateCommentPayload: jest.Mock;
  isCommentRouteError: jest.Mock;
};

const { processCommentCreation, moderateCommentContent } = jest.requireMock(
  "@/features/parts/postDetails/services/server"
) as {
  processCommentCreation: jest.Mock;
  moderateCommentContent: jest.Mock;
};

const { validateReplyCreation } = jest.requireMock(
  "@/features/parts/postDetails/services/server/comment/validateReply"
) as {
  validateReplyCreation: jest.Mock;
};

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

const callRoute = (
  path = "/api/post/clpost123/comments/create",
  body: Record<string, unknown> = { content: "Hello world" }
) =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const postId = url.pathname.split("/")[3];
      const context = { params: Promise.resolve({ postId }) };
      return POST(req, context);
    })
  )
    .post(path)
    .set("content-type", "application/json")
    .send(body);

describe("/api/post/[postId]/comments/add POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-comments-add",
      log: createMockLog(),
    });
    validateCuid.mockReturnValue({ success: true, data: "clpost123validated" });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    parseCreateCommentPayload.mockResolvedValue({
      content: "Hello world",
      parentId: null,
    });
    moderateCommentContent.mockResolvedValue({ ok: true });
    validateReplyCreation.mockResolvedValue({});
    processCommentCreation.mockResolvedValue({ id: "comment-1" });
    isCommentRouteError.mockReturnValue(false);
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when postId invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post/bad/comments/create");

    expect(validateCuid).toHaveBeenCalledWith("bad");
    expect(log.warn).toHaveBeenCalledWith(
      { postId: "bad" },
      "Invalid postId parameter for comment add"
    );
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: genericMessages.invalidParams,
    });
    expect(validateSession).not.toHaveBeenCalled();
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

    const response = await callRoute();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("unauthorized");
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns rate limit response when user exceeded quota", async () => {
    const rateResponse = apiResponse(false, {}, "Rate limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await callRoute();

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rate limited",
    });
    expect(parseCreateCommentPayload).not.toHaveBeenCalled();
  });

  it("returns route error response when payload invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-payload", log });
    const routeError = { message: "Invalid payload", status: 415 };
    parseCreateCommentPayload.mockRejectedValueOnce(routeError);
    isCommentRouteError.mockImplementationOnce(
      (error: unknown) => error === routeError
    );

    const response = await callRoute();

    expect(log.error).not.toHaveBeenCalled();
    expect(response.status).toBe(415);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "Invalid payload",
    });
  });

  it("returns moderation response when comment blocked", async () => {
    const moderationResponse = apiResponse(
      false,
      null,
      "blocked",
      422,
      "req-mod"
    );
    moderateCommentContent.mockResolvedValueOnce({
      ok: false,
      response: moderationResponse,
    });

    const response = await callRoute();

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "blocked",
    });
    expect(processCommentCreation).not.toHaveBeenCalled();
  });

  it("returns validation error response when replies invalid", async () => {
    const validationResponse = apiResponse(
      false,
      null,
      "bad reply",
      400,
      "req-reply"
    );
    validateReplyCreation.mockResolvedValueOnce({ error: validationResponse });

    const response = await callRoute();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "bad reply",
    });
    expect(processCommentCreation).not.toHaveBeenCalled();
  });

  it("creates comment successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const payload = { content: "Test content", parentId: null };
    parseCreateCommentPayload.mockResolvedValueOnce(payload);
    processCommentCreation.mockResolvedValueOnce({ id: "comment-123" });

    const response = await callRoute();

    expect(parseCreateCommentPayload).toHaveBeenCalledWith(
      expect.any(Request),
      log
    );
    expect(moderateCommentContent).toHaveBeenCalledWith({
      content: "Test content",
      userId: viewer.id,
      postId: "clpost123validated",
      log,
      requestId: "req-success",
    });
    expect(validateReplyCreation).toHaveBeenCalledWith(
      payload,
      log,
      "req-success"
    );
    expect(processCommentCreation).toHaveBeenCalledWith({
      authorId: viewer.id,
      postId: "clpost123validated",
      content: "Test content",
      parentId: null,
      requestId: "req-success",
      route: "/api/post/[postId]/comments/add",
    });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { comment: { id: "comment-123" } },
      message: commentMessages.created,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    processCommentCreation.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Add comment handler failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
