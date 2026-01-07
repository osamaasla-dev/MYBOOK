import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { genericMessages, userMessages } from "@/lib/messages";

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

jest.mock("@/features/parts/postDetails/services/server", () => ({
  validateCommentReactionPayload: jest.fn(),
  processCommentReactionCreation: jest.fn(),
}));

jest.mock("@/features/parts/post/utils/reaction", () => ({
  buildReactionResponsePayload: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/utils/server/comments", () => ({
  isCommentRouteError: jest.fn(),
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

const { checkRateLimit } = jest.requireMock(
  "@/features/parts/ratelimit/services"
) as {
  checkRateLimit: jest.Mock;
};

const { validateCommentReactionPayload, processCommentReactionCreation } =
  jest.requireMock("@/features/parts/postDetails/services/server") as {
    validateCommentReactionPayload: jest.Mock;
    processCommentReactionCreation: jest.Mock;
  };

const { buildReactionResponsePayload } = jest.requireMock(
  "@/features/parts/post/utils/reaction"
) as {
  buildReactionResponsePayload: jest.Mock;
};

const { isCommentRouteError } = jest.requireMock(
  "@/features/parts/postDetails/utils/server/comments"
) as {
  isCommentRouteError: jest.Mock;
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

const viewer = { id: "viewer-1", username: "viewer", name: "Viewer" };

const callRoute = (
  path = "/api/post/clpost123/comments/clcomment456/reactions/create",
  body: Record<string, unknown> = { reaction: "LIKE" }
) =>
  request(
    createTestServer((req: Request) => {
      const { pathname } = new URL(req.url);
      const segments = pathname.split("/");
      const postId = segments[3];
      const commentId = segments[5];
      const context = { params: Promise.resolve({ postId, commentId }) };
      return POST(req, context);
    })
  )
    .post(path)
    .set("content-type", "application/json")
    .send(body);

describe("/api/post/[postId]/comments/[commentId]/reactions POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-comment-react",
      log: createMockLog(),
    });
    validateCuid.mockImplementation((value?: string) =>
      value ? { success: true, data: value } : { success: false }
    );
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    validateCommentReactionPayload.mockResolvedValue({
      ok: true,
      data: { reaction: "LIKE" },
    });
    processCommentReactionCreation.mockResolvedValue({
      reaction: "LIKE",
      operation: "ADD",
      reactionsCount: 1,
      reactionSummary: { LIKE: 1 },
    });
    buildReactionResponsePayload.mockReturnValue({
      reaction: "LIKE",
      summary: { LIKE: 1 },
    });
    isCommentRouteError.mockReturnValue(false);
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when params invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post//comments//reactions/create");

    expect(log.warn).toHaveBeenCalledWith(
      { postId: "", commentId: "" },
      "Invalid route params for comment react"
    );
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: userMessages.invalidParams,
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
    const rateResponse = apiResponse(false, {}, "limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await callRoute();

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "limited",
    });
    expect(validateCommentReactionPayload).not.toHaveBeenCalled();
  });

  it("returns validation response when payload invalid", async () => {
    const payloadResponse = apiResponse(
      false,
      null,
      "invalid payload",
      400,
      "req-payload"
    );
    validateCommentReactionPayload.mockResolvedValueOnce({
      ok: false,
      response: payloadResponse,
    });

    const response = await callRoute();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "invalid payload",
    });
    expect(processCommentReactionCreation).not.toHaveBeenCalled();
  });

  it("creates reaction successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const payload = { ok: true, data: { reaction: "LOVE" } };
    validateCommentReactionPayload.mockResolvedValueOnce(payload);
    const reactionResult = {
      reaction: "LOVE",
      operation: "ADD",
      reactionsCount: 5,
      reactionSummary: { LOVE: 5 },
    };
    processCommentReactionCreation.mockResolvedValueOnce(reactionResult);
    buildReactionResponsePayload.mockReturnValueOnce({
      reaction: "LOVE",
      summary: { LOVE: 5 },
    });

    const response = await callRoute();

    expect(validateCommentReactionPayload).toHaveBeenCalledWith({
      request: expect.any(Request),
      log,
      requestId: "req-success",
    });
    expect(processCommentReactionCreation).toHaveBeenCalledWith({
      commentId: "clcomment456",
      postId: "clpost123",
      userId: viewer.id,
      reaction: "LOVE",
      userName: viewer.username,
      name: viewer.name,
      requestId: "req-success",
      route: "/api/post/[postId]/comments/[commentId]/reactions/create",
    });
    expect(buildReactionResponsePayload).toHaveBeenCalledWith(reactionResult);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { reaction: "LOVE", summary: { LOVE: 5 } },
      message: genericMessages.success,
    });
  });

  it("handles comment route errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-route-error", log });
    const routeError = { message: "blocked", status: 422 };
    processCommentReactionCreation.mockRejectedValueOnce(routeError);
    isCommentRouteError.mockImplementationOnce(
      (error: unknown) => error === routeError
    );

    const response = await callRoute();

    expect(log.warn).toHaveBeenCalledWith(
      { err: routeError, status: routeError.status },
      "Comment reaction route validation failed"
    );
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "blocked",
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    processCommentReactionCreation.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Comment reaction route failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
