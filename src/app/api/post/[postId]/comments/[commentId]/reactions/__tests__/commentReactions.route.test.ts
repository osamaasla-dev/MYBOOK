import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
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

jest.mock("@/features/parts/postDetails/services/server/comment", () => ({
  fetchCommentReactions: jest.fn(),
}));

jest.mock(
  "@/features/parts/postDetails/services/server/comment/reactions/schema",
  () => ({
    commentReactionsQuerySchema: {
      safeParse: jest.fn(),
    },
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

const { fetchCommentReactions } = jest.requireMock(
  "@/features/parts/postDetails/services/server/comment"
) as {
  fetchCommentReactions: jest.Mock;
};

const { commentReactionsQuerySchema } = jest.requireMock(
  "@/features/parts/postDetails/services/server/comment/reactions/schema"
) as {
  commentReactionsQuerySchema: { safeParse: jest.Mock };
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
  path = "/api/post/clpost123/comments/clcomment456/reactions?tab=ALL&limit=25"
) =>
  request(
    createTestServer((req: Request) => {
      const { pathname } = new URL(req.url);
      const segments = pathname.split("/");
      const postId = segments[3];
      const commentId = segments[5];
      const context = { params: Promise.resolve({ postId, commentId }) };
      return GET(req, context);
    })
  ).get(path);

describe("/api/post/[postId]/comments/[commentId]/reactions GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-comment-reactions",
      log: createMockLog(),
    });
    validateCuid.mockImplementation((value: string | undefined) =>
      value ? { success: true, data: value } : { success: false }
    );
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    commentReactionsQuerySchema.safeParse.mockReturnValue({
      success: true,
      data: { tab: "ALL", limit: 25, cursor: null },
    });
    fetchCommentReactions.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when params invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post//comments//reactions");

    expect(log.warn).toHaveBeenCalledWith(
      { postId: "", commentId: "" },
      "Invalid params for comment reactions"
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
    expect(fetchCommentReactions).not.toHaveBeenCalled();
  });

  it("returns 400 when query params invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-query", log });
    const queryError = { issues: [{ message: "bad tab" }] };
    commentReactionsQuerySchema.safeParse.mockReturnValueOnce({
      success: false,
      error: queryError,
    });

    const response = await callRoute(
      "/api/post/clpost123/comments/clcomment456/reactions?tab=oops"
    );

    expect(log.warn).toHaveBeenCalledWith(
      { issues: queryError.issues },
      "Invalid comment reactions query parameters"
    );
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "bad tab",
    });
    expect(fetchCommentReactions).not.toHaveBeenCalled();
  });

  it("fetches reactions successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    commentReactionsQuerySchema.safeParse.mockReturnValueOnce({
      success: true,
      data: { tab: "FRIENDS", limit: 15, cursor: "cur-1" },
    });
    const result = { items: [{ id: "r1" }], nextCursor: "next-1" };
    fetchCommentReactions.mockResolvedValueOnce(result);

    const response = await callRoute(
      "/api/post/clpost123/comments/clcomment456/reactions?tab=FRIENDS&limit=15&cursor=cur-1"
    );

    expect(fetchCommentReactions).toHaveBeenCalledWith({
      postId: "clpost123",
      commentId: "clcomment456",
      tab: "FRIENDS",
      limit: 15,
      cursor: "cur-1",
      viewerId: viewer.id,
      requestId: "req-success",
      route: "/api/post/[postId]/comments/[commentId]/reactions",
    });
    expect(log.info).toHaveBeenLastCalledWith(
      {
        postId: "clpost123",
        commentId: "clcomment456",
        tab: "FRIENDS",
        count: result.items.length,
        viewerId: viewer.id,
      },
      "Comment reactions fetched"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: result,
      message: genericMessages.success,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    fetchCommentReactions.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Comment reactions fetch failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
