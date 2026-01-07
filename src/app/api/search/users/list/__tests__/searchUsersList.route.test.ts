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

jest.mock("@/features/pages/search/utils/searchUsersParams", () => ({
  parseSearchUsersParams: jest.fn(),
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

const { parseSearchUsersParams } = jest.requireMock(
  "@/features/pages/search/utils/searchUsersParams"
) as {
  parseSearchUsersParams: jest.Mock;
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

const callRoute = (path = "/api/search/users/list?query=john") =>
  request(
    createTestServer((req: Request) => {
      return GET(req);
    })
  ).get(path);

describe("/api/search/users/list GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-search-list",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    parseSearchUsersParams.mockReturnValue({
      success: true,
      data: { query: "john", cursor: undefined, limit: 10 },
    });
    fetchSearchableUsers.mockResolvedValue({
      items: [{ id: "user-1", username: "john" }],
      nextCursor: "next-1",
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
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(parseSearchUsersParams).not.toHaveBeenCalled();
  });

  it("returns 400 when params invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    const issues = [{ path: ["query"], message: "Missing" }];
    parseSearchUsersParams.mockReturnValueOnce({
      success: false,
      issues,
      message: "Invalid search parameters",
    });

    const response = await callRoute("/api/search/users/list?query=");

    expect(log.warn).toHaveBeenCalledWith(
      { issues },
      "Invalid search list query params"
    );
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: { items: [], nextCursor: null },
      message: "Invalid search parameters",
    });
    expect(fetchSearchableUsers).not.toHaveBeenCalled();
  });

  it("fetches users successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    parseSearchUsersParams.mockReturnValueOnce({
      success: true,
      data: { query: "doe", cursor: "cursor-1", limit: 5 },
    });
    const items = [
      { id: "user-1", username: "john" },
      { id: "user-2", username: "doe" },
    ];
    fetchSearchableUsers.mockResolvedValueOnce({
      items,
      nextCursor: "next-2",
    });

    const response = await callRoute("/api/search/users/list?query=doe");

    expect(fetchSearchableUsers).toHaveBeenCalledWith({
      viewerId: viewer.id,
      query: "doe",
      cursor: "cursor-1",
      limit: 5,
    });
    expect(log.info).toHaveBeenCalledWith(
      {
        viewerId: viewer.id,
        query: "doe",
        count: items.length,
        nextCursor: "next-2",
      },
      "User search list completed"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { items, nextCursor: "next-2" },
      message: userMessages.success,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    fetchSearchableUsers.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      {
        err: { status: 503, message: "service-down" },
        query: "john",
        status: 503,
      },
      "User search list failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: { items: [], nextCursor: null },
      message: "service-down",
    });
  });
});
