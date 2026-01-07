import request from "supertest";
import { createTestServer } from "tests/testServer";
import { DELETE } from "../route";
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

jest.mock("@/features/parts/postDetails/services/server/comment", () => ({
  removeCommentReaction: jest.fn(),
}));

jest.mock("@/features/parts/post/utils/reaction", () => ({
  buildReactionResponsePayload: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/utils/server/comments", () => ({
  isCommentRouteError: jest.fn(),
}));

jest.mock("@/features/parts/post/utils/realtime", () => ({
  broadcastCommentMetaEvent: jest.fn(),
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

const { removeCommentReaction } = jest.requireMock(
  "@/features/parts/postDetails/services/server/comment"
) as {
  removeCommentReaction: jest.Mock;
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

const { broadcastCommentMetaEvent } = jest.requireMock(
  "@/features/parts/post/utils/realtime"
) as {
  broadcastCommentMetaEvent: jest.Mock;
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const viewer = { id: "viewer-1" };

const callRoute = (
  path = "/api/post/clpost123/comments/clcomment456/reactions/delete"
) =>
  request(
    createTestServer((req: Request) => {
      const segments = new URL(req.url).pathname.split("/");
      const postId = segments[3];
      const commentId = segments[5];
      const context = { params: Promise.resolve({ postId, commentId }) };
      return DELETE(req, context);
    })
  ).delete(path);

describe("/api/post/[postId]/comments/[commentId]/reactions DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-comment-reaction-delete",
      log: createMockLog(),
    });
    validateCuid.mockImplementation((value?: string) =>
      value ? { success: true, data: value } : { success: false }
    );
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    const removalResult = {
      reaction: null,
      operation: "REMOVE",
      reactionsCount: 0,
      reactionSummary: {},
      parentId: null,
    };
    removeCommentReaction.mockResolvedValue(removalResult);
    buildReactionResponsePayload.mockReturnValue({
      reaction: null,
      summary: {},
    });
    isCommentRouteError.mockReturnValue(false);
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when params invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post//comments//reactions/delete");

    expect(log.warn).toHaveBeenCalledWith(
      { postId: "", commentId: "" },
      "Invalid route params for comment reaction delete"
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
    expect(removeCommentReaction).not.toHaveBeenCalled();
  });

  it("removes reaction successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const removalResult = {
      reaction: null,
      operation: "REMOVE",
      reactionsCount: 2,
      reactionSummary: { LOVE: 2 },
      parentId: "parent-1",
    };
    removeCommentReaction.mockResolvedValueOnce(removalResult);
    const payload = { reaction: null, summary: { LOVE: 2 } };
    buildReactionResponsePayload.mockReturnValueOnce(payload);

    const response = await callRoute();

    expect(removeCommentReaction).toHaveBeenCalledWith({
      commentId: "clcomment456",
      postId: "clpost123",
      userId: viewer.id,
    });
    expect(buildReactionResponsePayload).toHaveBeenCalledWith(removalResult);
    expect(broadcastCommentMetaEvent).toHaveBeenCalledWith({
      postId: "clpost123",
      initiatorId: viewer.id,
      parentId: "parent-1",
      commentId: "clcomment456",
      reactionsCount: 2,
      reactionSummary: { LOVE: 2 },
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: payload,
      message: genericMessages.success,
    });
    expect(log.info).toHaveBeenCalledWith(
      {
        commentId: "clcomment456",
        userId: viewer.id,
        operation: "REMOVE",
      },
      "commentReaction.removed"
    );
  });

  it("handles comment route errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-route-error", log });
    const routeError = { message: "blocked", status: 403 };
    removeCommentReaction.mockRejectedValueOnce(routeError);
    isCommentRouteError.mockImplementationOnce(
      (error: unknown) => error === routeError
    );

    const response = await callRoute();

    expect(log.warn).toHaveBeenCalledWith(
      { err: routeError, status: routeError.status },
      "Comment reaction delete failed"
    );
    expect(response.status).toBe(403);
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
    removeCommentReaction.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Comment reaction delete route failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
