import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/pages/profile/utils/postsTab", () => ({
  profilePostsQuerySchema: {
    parse: jest.fn(),
  },
}));

jest.mock("@/features/pages/profile/utils", () => ({
  fetchProfileUserByUsername: jest.fn(),
}));

jest.mock("@/features/parts/block/utils/server", () => ({
  isBlock: jest.fn(),
}));

jest.mock("@/features/pages/profile/services/server/postsTab", () => ({
  getProfilePosts: jest.fn(),
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

const { profilePostsQuerySchema } = jest.requireMock(
  "@/features/pages/profile/utils/postsTab"
) as {
  profilePostsQuerySchema: { parse: jest.Mock };
};

const { fetchProfileUserByUsername } = jest.requireMock(
  "@/features/pages/profile/utils"
) as {
  fetchProfileUserByUsername: jest.Mock;
};

const { isBlock } = jest.requireMock("@/features/parts/block/utils/server") as {
  isBlock: jest.Mock;
};

const { getProfilePosts } = jest.requireMock(
  "@/features/pages/profile/services/server/postsTab"
) as {
  getProfilePosts: jest.Mock;
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

const callRoute = (path = "/api/profile/john/posts?cursor=abc&limit=20") =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      const username = segments[2];
      const context = { params: Promise.resolve({ username }) };
      return GET(req, context);
    })
  ).get(path);

describe("/api/profile/[username]/posts GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-profile-posts",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    profilePostsQuerySchema.parse.mockReturnValue({ cursor: "c1", limit: 20 });
    fetchProfileUserByUsername.mockResolvedValue({
      id: "owner-1",
      username: "john",
    });
    isBlock.mockResolvedValue({ anyBlock: false });
    getProfilePosts.mockResolvedValue({
      posts: [{ id: "post-1" }],
      nextCursor: "next",
    });
    normalizeError.mockImplementation((err) => err);
  });

  it("returns session response when auth fails", async () => {
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
    expect(profilePostsQuerySchema.parse).not.toHaveBeenCalled();
  });

  it("returns 404 when profile owner not found", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-missing", log });
    fetchProfileUserByUsername.mockResolvedValueOnce(null);

    const response = await callRoute("/api/profile/missing/posts");

    expect(log.warn).toHaveBeenCalledWith(
      { username: "missing", requestId: "req-missing" },
      "Profile owner not found for posts"
    );
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: userMessages.notFound,
    });
    expect(getProfilePosts).not.toHaveBeenCalled();
  });

  it("returns 404 when relationship blocks access", async () => {
    fetchProfileUserByUsername.mockResolvedValueOnce({
      id: "owner-1",
      username: "john",
    });
    isBlock.mockResolvedValueOnce({ anyBlock: true });

    const response = await callRoute();

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: userMessages.notFound,
    });
    expect(getProfilePosts).not.toHaveBeenCalled();
  });

  it("fetches posts successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    profilePostsQuerySchema.parse.mockReturnValueOnce({
      cursor: "cursor-1",
      limit: 10,
    });
    const result = { posts: [{ id: "post-1" }], nextCursor: "next-1" };
    getProfilePosts.mockResolvedValueOnce(result);

    const response = await callRoute(
      "/api/profile/john/posts?cursor=cursor-1&limit=10"
    );

    expect(getProfilePosts).toHaveBeenCalledWith({
      username: "john",
      viewerId: viewer.id,
      cursor: "cursor-1",
      limit: 10,
      log,
      requestId: "req-success",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        posts: result.posts,
        nextCursor: result.nextCursor,
      },
      message: userMessages.success,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    getProfilePosts.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: unexpected, status: 503 },
      userMessages.failed
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
