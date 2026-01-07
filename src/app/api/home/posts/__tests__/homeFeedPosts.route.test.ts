import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { genericMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/pages/home/services/utils", () => ({
  parseFeedParams: jest.fn(),
}));

jest.mock("@/features/pages/home/services/posts/user-ranking", () => ({
  getImportantUsersForFeed: jest.fn(),
}));

jest.mock("@/features/pages/home/services/posts/post-ranking", () => ({
  getRankedFeedPage: jest.fn(),
}));

jest.mock("@/features/pages/home/services/posts/feed", () => ({
  fetchFeedPostsForViewer: jest.fn(),
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

const { parseFeedParams } = jest.requireMock(
  "@/features/pages/home/services/utils"
) as { parseFeedParams: jest.Mock };

const { getImportantUsersForFeed } = jest.requireMock(
  "@/features/pages/home/services/posts/user-ranking"
) as { getImportantUsersForFeed: jest.Mock };

const { getRankedFeedPage } = jest.requireMock(
  "@/features/pages/home/services/posts/post-ranking"
) as { getRankedFeedPage: jest.Mock };

const { fetchFeedPostsForViewer } = jest.requireMock(
  "@/features/pages/home/services/posts/feed"
) as { fetchFeedPostsForViewer: jest.Mock };

const { normalizeError } = jest.requireMock("@/lib/http/normalizeError") as {
  normalizeError: jest.Mock;
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const viewer = { id: "viewer-1", name: "Viewer", username: "viewer" };

const serverFactory = () =>
  request(createTestServer((req: Request) => GET(req)));

describe("/api/home/posts GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-feed",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    parseFeedParams.mockReturnValue({
      cursor: null,
      pageSize: 20,
    });
    getImportantUsersForFeed.mockResolvedValue(["friend-1"]);
    getRankedFeedPage.mockResolvedValue({
      postsIds: ["post-1", "post-2"],
      nextCursor: "cursor-2",
      cacheHit: false,
    });
    fetchFeedPostsForViewer.mockResolvedValue([
      { id: "post-1" },
      { id: "post-2" },
    ]);
    normalizeError.mockReturnValue({ status: 500, message: "boom" });
  });

  it("returns session response when validation fails", async () => {
    const sessionResponse = apiResponse(
      false,
      {},
      "unauthorized",
      401,
      "req-session"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: sessionResponse,
    });

    const response = await serverFactory().get("/api/home/posts").send();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(parseFeedParams).not.toHaveBeenCalled();
  });

  it("returns parse error when params invalid", async () => {
    const parseError = apiResponse(false, {}, "bad params", 400, "req-parse");
    parseFeedParams.mockReturnValueOnce({ error: parseError });

    const response = await serverFactory().get("/api/home/posts").send();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "bad params",
    });
    expect(getImportantUsersForFeed).not.toHaveBeenCalled();
  });

  it("returns feed posts when pipeline succeeds", async () => {
    const response = await serverFactory().get("/api/home/posts").send();

    expect(parseFeedParams).toHaveBeenCalled();
    expect(getImportantUsersForFeed).toHaveBeenCalledWith("viewer-1");
    expect(getRankedFeedPage).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      importantUsers: ["friend-1"],
      cursor: null,
      pageSize: 20,
    });
    expect(fetchFeedPostsForViewer).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      postIds: ["post-1", "post-2"],
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        posts: [{ id: "post-1" }, { id: "post-2" }],
        nextCursor: "cursor-2",
      },
      message: genericMessages.success,
    });
  });

  it("returns normalized error when pipeline throws", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const serviceError = new Error("feed failed");
    getRankedFeedPage.mockRejectedValueOnce(serviceError);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory().get("/api/home/posts").send();

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 503 },
      "Feed posts request failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
