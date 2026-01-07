import request from "supertest";
import { createTestServer } from "tests/testServer";
import { PATCH } from "../route";
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

jest.mock("@/features/parts/postDetails/utils/server/comments", () => ({
  parseUpdateCommentPayload: jest.fn(),
  isCommentRouteError: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/services/server", () => ({
  ensureCommentEditAccess: jest.fn(),
  moderateCommentContent: jest.fn(),
  processCommentUpdate: jest.fn(),
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

const { parseUpdateCommentPayload, isCommentRouteError } = jest.requireMock(
  "@/features/parts/postDetails/utils/server/comments"
) as {
  parseUpdateCommentPayload: jest.Mock;
  isCommentRouteError: jest.Mock;
};

const {
  ensureCommentEditAccess,
  moderateCommentContent,
  processCommentUpdate,
} = jest.requireMock("@/features/parts/postDetails/services/server") as {
  ensureCommentEditAccess: jest.Mock;
  moderateCommentContent: jest.Mock;
  processCommentUpdate: jest.Mock;
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
  path = "/api/post/clpost123/comments/clcomment456/update",
  body: Record<string, unknown> = { commentId: "clcomment456", content: "Hi" }
) =>
  request(
    createTestServer((req: Request) => {
      const segments = new URL(req.url).pathname.split("/");
      const postId = segments[3];
      const commentId = segments[5];
      const context = { params: Promise.resolve({ postId, commentId }) };
      return PATCH(req, context);
    })
  )
    .patch(path)
    .set("content-type", "application/json")
    .send(body);

describe("/api/post/[postId]/comments/[commentId]/edit PATCH", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-comment-update",
      log: createMockLog(),
    });
    validateCuid.mockImplementation((value) =>
      value ? { success: true, data: value } : { success: false }
    );
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    parseUpdateCommentPayload.mockResolvedValue({
      commentId: "clcomment456",
      content: "Hello world",
    });
    ensureCommentEditAccess.mockResolvedValue({
      comment: { id: "clcomment456", authorId: viewer.id },
    });
    moderateCommentContent.mockResolvedValue({ ok: true });
    processCommentUpdate.mockResolvedValue({
      id: "clcomment456",
      content: "Hi",
    });
    isCommentRouteError.mockReturnValue(false);
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when route params invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post//comments//update");

    expect(log.warn).toHaveBeenCalledWith(
      { postId: "", commentId: "" },
      "Invalid route params for comment edit"
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
    expect(parseUpdateCommentPayload).not.toHaveBeenCalled();
  });

  it("returns 400 when payload commentId mismatches route", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-mismatch", log });
    parseUpdateCommentPayload.mockResolvedValueOnce({
      commentId: "different",
      content: "Hello",
    });

    const response = await callRoute();

    expect(log.warn).toHaveBeenCalledWith(
      {
        routeCommentId: "clcomment456",
        payloadCommentId: "different",
      },
      genericMessages.invalidParams
    );
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: genericMessages.invalidParams,
    });
  });

  it("returns route error response when payload invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-payload", log });
    const routeError = { message: "Invalid payload", status: 415 };
    parseUpdateCommentPayload.mockRejectedValueOnce(routeError);
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

  it("returns moderation response when content blocked", async () => {
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
    expect(processCommentUpdate).not.toHaveBeenCalled();
  });

  it("updates comment successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const payload = { commentId: "clcomment456", content: "Updated" };
    parseUpdateCommentPayload.mockResolvedValueOnce(payload);
    processCommentUpdate.mockResolvedValueOnce({
      id: "clcomment456",
      content: "Updated",
    });

    const response = await callRoute();

    expect(parseUpdateCommentPayload).toHaveBeenCalledWith(
      expect.any(Request),
      log
    );
    expect(ensureCommentEditAccess).toHaveBeenCalledWith({
      commentId: "clcomment456",
      postId: "clpost123",
      actorId: viewer.id,
    });
    expect(moderateCommentContent).toHaveBeenCalledWith({
      content: "Updated",
      userId: viewer.id,
      postId: "clpost123",
      log,
      requestId: "req-success",
    });
    expect(processCommentUpdate).toHaveBeenCalledWith({
      commentId: "clcomment456",
      content: "Updated",
      actorId: viewer.id,
      requestId: "req-success",
      route: "/api/post/[postId]/comments/[commentId]/edit",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { comment: { id: "clcomment456", content: "Updated" } },
      message: commentMessages.updated,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    processCommentUpdate.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Edit comment handler failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
