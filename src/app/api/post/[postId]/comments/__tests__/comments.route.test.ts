import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { commentMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/services/server", () => ({
  ensureCommentFetchAccess: jest.fn(),
  fetchPostComments: jest.fn(),
}));

jest.mock("@/features/parts/postDetails/utils/server/comments", () => ({
  parseCommentsRouteParams: jest.fn(),
  parseCommentsQueryParams: jest.fn(),
  isCommentRouteError: jest.fn(),
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

const { ensureCommentFetchAccess, fetchPostComments } = jest.requireMock(
  "@/features/parts/postDetails/services/server"
) as {
  ensureCommentFetchAccess: jest.Mock;
  fetchPostComments: jest.Mock;
};

const {
  parseCommentsRouteParams,
  parseCommentsQueryParams,
  isCommentRouteError,
} = jest.requireMock("@/features/parts/postDetails/utils/server/comments") as {
  parseCommentsRouteParams: jest.Mock;
  parseCommentsQueryParams: jest.Mock;
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

const callRoute = (path = "/api/post/clpost123/comments") =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const postId = url.pathname.split("/")[3];
      const context = { params: Promise.resolve({ postId }) };
      return GET(req, context);
    })
  ).get(path);

describe("/api/post/[postId]/comments GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-comments",
      log: createMockLog(),
    });
    parseCommentsRouteParams.mockReturnValue("clpost123normalized");
    parseCommentsQueryParams.mockReturnValue({
      cursor: null,
      parentId: null,
      limit: 20,
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    ensureCommentFetchAccess.mockResolvedValue(undefined);
    fetchPostComments.mockResolvedValue({
      comments: [],
      nextCursor: null,
    });
    isCommentRouteError.mockImplementation(() => false);
    normalizeError.mockImplementation((err) => err);
  });

  it("fetches comments successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    parseCommentsQueryParams.mockReturnValueOnce({
      cursor: "cursor-1",
      parentId: "parent-1",
      limit: 15,
    });
    const result = {
      comments: [{ id: "comment-1" }],
      nextCursor: "cursor-2",
    };
    fetchPostComments.mockResolvedValueOnce(result);

    const response = await callRoute(
      "/api/post/clpost123/comments?cursor=cursor-1&parentId=parent-1&limit=15"
    );

    expect(parseCommentsRouteParams).toHaveBeenCalledWith("clpost123", log);
    expect(parseCommentsQueryParams).toHaveBeenCalledWith(
      expect.any(URLSearchParams),
      log
    );
    expect(ensureCommentFetchAccess).toHaveBeenCalledWith({
      postId: "clpost123normalized",
      parentId: "parent-1",
      viewerId: viewer.id,
    });
    expect(fetchPostComments).toHaveBeenCalledWith({
      postId: "clpost123normalized",
      parentId: "parent-1",
      cursor: "cursor-1",
      limit: 15,
      viewerId: viewer.id,
    });
    expect(log.info).toHaveBeenCalledWith("Fetching comments completed");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        comments: result.comments,
        nextCursor: result.nextCursor,
      },
      message: commentMessages.fetched,
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

    const response = await callRoute();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("unauthorized");
    expect(ensureCommentFetchAccess).not.toHaveBeenCalled();
  });

  it("returns response for comment route errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    const routeError = { message: "bad params", status: 422 };
    parseCommentsRouteParams.mockImplementationOnce(() => {
      throw routeError;
    });
    isCommentRouteError.mockImplementationOnce(
      (error: unknown) => error === routeError
    );

    const response = await callRoute("/api/post/bad/comments");

    expect(log.error).toHaveBeenCalledWith(
      { err: routeError },
      "Fetch comments handler failed"
    );
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "bad params",
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    fetchPostComments.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Fetch comments handler failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
