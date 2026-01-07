import request from "supertest";
import { createTestServer } from "tests/testServer";
import { DELETE } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { commentMessages, userMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/schemas/ids", () => ({
  validateCuid: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/services/server/comment", () => ({
  ensureCommentDeleteAccess: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/services/server", () => ({
  processCommentDeletion: jest.fn(),
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

const { ensureCommentDeleteAccess } = jest.requireMock(
  "@/features/parts/postDetails/services/server/comment"
) as {
  ensureCommentDeleteAccess: jest.Mock;
};

const { processCommentDeletion } = jest.requireMock(
  "@/features/parts/postDetails/services/server"
) as {
  processCommentDeletion: jest.Mock;
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

const viewer = { id: "viewer-1" };

const callRoute = (path = "/api/post/clpost123/comments/clcomment456/delete") =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const [, , , postId, , commentId] = url.pathname.split("/");
      const context = { params: Promise.resolve({ postId, commentId }) };
      return DELETE(req, context);
    })
  ).delete(path);

describe("/api/post/[postId]/comments/[commentId]/delete DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-comment-delete",
      log: createMockLog(),
    });
    validateCuid.mockImplementation((value) =>
      value ? { success: true, data: `${value}-validated` } : { success: false }
    );
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    ensureCommentDeleteAccess.mockResolvedValue({
      comment: {
        id: "comment-validated",
        parentId: null,
        authorId: "author-1",
      },
      post: { authorId: "post-author" },
    });
    processCommentDeletion.mockResolvedValue({ id: "deleted-comment" });
    isCommentRouteError.mockReturnValue(false);
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when params invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post//comments//delete");

    expect(log.warn).toHaveBeenCalledWith(
      { postId: "", commentId: "" },
      "Invalid route params for comment delete"
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
    expect(ensureCommentDeleteAccess).not.toHaveBeenCalled();
  });

  it("deletes comment successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });

    const response = await callRoute();

    expect(ensureCommentDeleteAccess).toHaveBeenCalledWith({
      commentId: "clcomment456-validated",
      postId: "clpost123-validated",
      actorId: viewer.id,
    });
    expect(processCommentDeletion).toHaveBeenCalledWith({
      commentId: "comment-validated",
      postId: "clpost123-validated",
      parentId: null,
      postAuthorId: "post-author",
      deletedById: viewer.id,
      commentAuthorId: "author-1",
      requestId: "req-success",
      route: "/api/post/[postId]/comments/[commentId]/delete",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { commentId: "deleted-comment" },
      message: commentMessages.deleted,
    });
  });

  it("returns route error response when access fails", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-route-error", log });
    const routeError = { message: "not allowed", status: 403 };
    ensureCommentDeleteAccess.mockRejectedValueOnce(routeError);
    isCommentRouteError.mockImplementationOnce(
      (error: unknown) => error === routeError
    );

    const response = await callRoute();

    expect(log.error).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "not allowed",
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    processCommentDeletion.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Delete comment handler failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
