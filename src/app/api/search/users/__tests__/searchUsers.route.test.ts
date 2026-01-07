import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { USER_SEARCH_SUGGESTION_LIMIT } from "@/features/pages/search/constants";
import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/pages/search/services/server/searchUsersService", () => ({
  fetchSearchableUsers: jest.fn(),
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

const { fetchSearchableUsers } = jest.requireMock(
  "@/features/pages/search/services/server/searchUsersService"
) as {
  fetchSearchableUsers: jest.Mock;
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

const callRoute = (query?: string) => {
  const search =
    query !== undefined ? `?query=${encodeURIComponent(query)}` : "";
  return request(
    createTestServer((req: Request) => {
      return GET(req);
    })
  ).get(`/api/search/users${search}`);
};

describe("/api/search/users GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-search-users",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    fetchSearchableUsers.mockResolvedValue({
      items: [{ id: "user-1", username: "john" }],
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

    const response = await callRoute("john");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(fetchSearchableUsers).not.toHaveBeenCalled();
  });

  it("returns empty results when query missing", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-empty", log });

    const response = await callRoute("   ");

    expect(log.info).toHaveBeenCalledWith(
      "Empty search query received, returning empty result set"
    );
    expect(fetchSearchableUsers).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { hits: [] },
      message: userMessages.success,
    });
  });

  it("fetches users successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const items = [
      { id: "user-1", username: "john" },
      { id: "user-2", username: "doe" },
    ];
    fetchSearchableUsers.mockResolvedValueOnce({ items });

    const response = await callRoute("  john  ");

    expect(fetchSearchableUsers).toHaveBeenCalledWith({
      viewerId: viewer.id,
      query: "john",
      limit: USER_SEARCH_SUGGESTION_LIMIT,
    });
    expect(log.info).toHaveBeenCalledWith(
      { query: "john", resultCount: items.length, viewerId: viewer.id },
      "User search suggestions completed"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { hits: items },
      message: userMessages.success,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("search down");
    fetchSearchableUsers.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute("john");

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "User search failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: { hits: [] },
      message: "service-down",
    });
  });
});
