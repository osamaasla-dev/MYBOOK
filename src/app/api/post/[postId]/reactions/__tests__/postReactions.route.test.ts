import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/post/services/server", () => ({
  validatePostReactionsQuery: jest.fn(),
}));

jest.mock(
  "@/features/parts/post/services/server/reactions/fetchPostReactions",
  () => ({
    fetchPostReactions: jest.fn(),
  })
);

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { validatePostReactionsQuery } = jest.requireMock(
  "@/features/parts/post/services/server"
) as { validatePostReactionsQuery: jest.Mock };

const { fetchPostReactions } = jest.requireMock(
  "@/features/parts/post/services/server/reactions/fetchPostReactions"
) as { fetchPostReactions: jest.Mock };

const { normalizeError } = jest.requireMock("@/lib/http/normalizeError") as {
  normalizeError: jest.Mock;
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: () => createMockLog(),
});

const viewer = { id: "viewer-1" };

const callRoute = (path = "/api/post/clpost123/reactions?tab=ALL&limit=20") =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const postId = url.pathname.split("/")[3];
      const context = { params: Promise.resolve({ postId }) };
      return GET(req, context);
    })
  ).get(path);

const defaultQueryResult = {
  ok: true,
  postId: "clpost123validated",
  query: {
    postId: "clpost123validated",
    tab: "ALL",
    limit: 20,
    cursor: null,
  },
};

describe("/api/post/[postId]/reactions GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-reactions",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    validatePostReactionsQuery.mockResolvedValue(defaultQueryResult);
    fetchPostReactions.mockResolvedValue({ items: [], nextCursor: null });
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

    const response = await callRoute();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("unauthorized");
    expect(validatePostReactionsQuery).not.toHaveBeenCalled();
  });

  it("returns query validation response when params invalid", async () => {
    const invalidResponse = apiResponse(
      false,
      {},
      "Invalid tab",
      400,
      "req-invalid"
    );
    validatePostReactionsQuery.mockResolvedValueOnce({
      ok: false,
      response: invalidResponse,
    });

    const response = await callRoute("/api/post/clpost123/reactions?tab=WRONG");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Invalid tab",
    });
    expect(fetchPostReactions).not.toHaveBeenCalled();
  });

  it("fetches reactions successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const reactions = {
      items: [{ id: "reaction-1" }],
      nextCursor: "cursor-1",
    };
    fetchPostReactions.mockResolvedValueOnce(reactions);

    const response = await callRoute();

    expect(validatePostReactionsQuery).toHaveBeenCalledWith({
      postId: "clpost123",
      searchParams: expect.any(URLSearchParams),
      log,
      requestId: "req-success",
    });
    expect(fetchPostReactions).toHaveBeenCalledWith({
      postId: "clpost123validated",
      tab: "ALL",
      limit: 20,
      cursor: null,
      viewerId: viewer.id,
      requestId: "req-success",
      route: "/api/post/[postId]/reactions",
    });
    expect(log.info).toHaveBeenCalledWith(
      {
        postId: "clpost123validated",
        tab: "ALL",
        count: reactions.items.length,
        viewerId: viewer.id,
      },
      "Post reactions fetched"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: reactions,
      message: postMessages.reactions.fetchSuccess,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    fetchPostReactions.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Post reactions fetch failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
