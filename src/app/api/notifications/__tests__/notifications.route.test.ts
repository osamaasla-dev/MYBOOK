import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { notificationMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/notifications/utils", () => ({
  parseNotificationListQuery: jest.fn(),
}));

jest.mock("@/features/parts/notifications/services/server", () => ({
  fetchUserNotifications: jest.fn(),
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

const { parseNotificationListQuery } = jest.requireMock(
  "@/features/parts/notifications/utils"
) as { parseNotificationListQuery: jest.Mock };

const { fetchUserNotifications } = jest.requireMock(
  "@/features/parts/notifications/services/server"
) as { fetchUserNotifications: jest.Mock };

const { normalizeError } = jest.requireMock("@/lib/http/normalizeError") as {
  normalizeError: jest.Mock;
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const serverFactory = () =>
  request(createTestServer((req: Request) => GET(req)));

describe("/api/notifications GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-notifications",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({
      ok: true,
      user: { id: "viewer-1", username: "viewer" },
    });
    parseNotificationListQuery.mockReturnValue({
      ok: true,
      value: { limit: 20, cursor: null, tab: "all" },
    });
    fetchUserNotifications.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    normalizeError.mockReturnValue({ status: 500, message: "unexpected" });
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

    const response = await serverFactory().get("/api/notifications");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("unauthorized");
    expect(parseNotificationListQuery).not.toHaveBeenCalled();
  });

  it("returns 400 when query invalid", async () => {
    parseNotificationListQuery.mockReturnValueOnce({
      ok: false,
      message: "bad-query",
    });

    const response = await serverFactory().get("/api/notifications?limit=-1");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(notificationMessages.invalidParams);
    expect(fetchUserNotifications).not.toHaveBeenCalled();
  });

  it("fetches notifications successfully", async () => {
    fetchUserNotifications.mockResolvedValueOnce({
      items: [{ id: "notif-1" }],
      nextCursor: "cursor-2",
    });

    const response = await serverFactory().get("/api/notifications?limit=20");

    expect(fetchUserNotifications).toHaveBeenCalledWith({
      userId: "viewer-1",
      limit: 20,
      cursor: null,
      tab: "all",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { items: [{ id: "notif-1" }], nextCursor: "cursor-2" },
      message: notificationMessages.fetchSuccess,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    fetchUserNotifications.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory().get("/api/notifications");

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: unexpected, status: 503 },
      notificationMessages.fetchFailed
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
