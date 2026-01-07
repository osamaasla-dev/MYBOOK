import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { notificationMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/notifications/services/server", () => ({
  markNotificationAsRead: jest.fn(),
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

const { markNotificationAsRead } = jest.requireMock(
  "@/features/parts/notifications/services/server"
) as { markNotificationAsRead: jest.Mock };

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
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const segments = url.pathname.split("/");
      const notificationId = segments[3] ?? "";
      const context = {
        params: Promise.resolve({ notificationId }),
      };
      return POST(req, context);
    })
  );

describe("/api/notifications/[notificationId]/mark-read POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-notification",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({
      ok: true,
      user: { id: "viewer-1", username: "viewer" },
    });
    markNotificationAsRead.mockResolvedValue({ count: 1 });
    normalizeError.mockReturnValue({ status: 500, message: "unexpected" });
  });

  it("returns 400 when notification id missing", async () => {
    const response = await serverFactory()
      .post("/api/notifications//mark-read")
      .send();

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(notificationMessages.invalidParams);
    expect(validateSession).not.toHaveBeenCalled();
  });

  it("marks notification as read for authenticated viewer", async () => {
    const response = await serverFactory()
      .post("/api/notifications/notif-1/mark-read")
      .send();

    expect(markNotificationAsRead).toHaveBeenCalledWith("viewer-1", "notif-1");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { updated: 1 },
      message: notificationMessages.markReadSuccess,
    });
  });

  it("returns normalized error when markNotificationAsRead fails", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const serviceError = new Error("db down");
    markNotificationAsRead.mockRejectedValueOnce(serviceError);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory()
      .post("/api/notifications/notif-1/mark-read")
      .send();

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 503 },
      notificationMessages.markReadFailed
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });

  it("returns session response when authentication fails", async () => {
    const unauthorized = apiResponse(
      false,
      {},
      "unauthorized",
      401,
      "req-auth"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: unauthorized,
    });

    const response = await serverFactory()
      .post("/api/notifications/notif-1/mark-read")
      .send();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(markNotificationAsRead).not.toHaveBeenCalled();
  });
});
