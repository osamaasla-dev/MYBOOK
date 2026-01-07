import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/pages/profile/types", () => ({
  usernameSchema: { safeParse: jest.fn() },
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/features/pages/profile/utils", () => ({
  fetchProfileUserByUsername: jest.fn(),
}));

jest.mock(
  "@/features/pages/profile/services/server/processProfileView",
  () => ({
    processProfileView: jest.fn(),
  })
);

jest.mock("@/features/parts/interaction/services", () => ({
  recordInteraction: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { usernameSchema } = jest.requireMock(
  "@/features/pages/profile/types"
) as {
  usernameSchema: { safeParse: jest.Mock };
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { checkRateLimit } = jest.requireMock(
  "@/features/parts/ratelimit/services"
) as {
  checkRateLimit: jest.Mock;
};

const { fetchProfileUserByUsername } = jest.requireMock(
  "@/features/pages/profile/utils"
) as {
  fetchProfileUserByUsername: jest.Mock;
};

const { processProfileView } = jest.requireMock(
  "@/features/pages/profile/services/server/processProfileView"
) as {
  processProfileView: jest.Mock;
};

const { recordInteraction } = jest.requireMock(
  "@/features/parts/interaction/services"
) as {
  recordInteraction: jest.Mock;
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

const callRoute = (path = "/api/profile/john") =>
  request(
    createTestServer((req: Request) => {
      const pathname = new URL(req.url).pathname;
      const username = pathname.split("/").pop();
      const context = { params: Promise.resolve({ username }) };
      return GET(req, context);
    })
  ).get(path);

describe("/api/profile/[username] GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-profile",
      log: createMockLog(),
    });
    usernameSchema.safeParse.mockReturnValue({ success: true, data: "john" });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    fetchProfileUserByUsername.mockResolvedValue({
      id: "user-1",
      username: "john",
    });
    processProfileView.mockResolvedValue({
      payload: { profile: {} },
      shouldRecordInteraction: false,
    });
    recordInteraction.mockResolvedValue(undefined);
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when username invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    usernameSchema.safeParse.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/profile/??");

    expect(log.warn).toHaveBeenCalledWith(userMessages.missingParams);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: userMessages.invalidParams,
    });
    expect(validateSession).not.toHaveBeenCalled();
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
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns rate limit response when user exceeded quota", async () => {
    const rateResponse = apiResponse(false, {}, "limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await callRoute();

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "limited",
    });
    expect(fetchProfileUserByUsername).not.toHaveBeenCalled();
  });

  it("returns 404 when profile not found", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-missing", log });
    fetchProfileUserByUsername.mockResolvedValueOnce(null);

    const response = await callRoute("/api/profile/missing");

    expect(log.warn).toHaveBeenCalledWith(userMessages.notFound);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: userMessages.notFound,
    });
  });

  it("returns 404 when profile view is blocked", async () => {
    processProfileView.mockRejectedValueOnce(new Error("PROFILE_BLOCKED"));

    const response = await callRoute();

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: userMessages.notFound,
    });
  });

  it("records interaction when requested", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-record", log });
    processProfileView.mockResolvedValueOnce({
      payload: { profile: { id: "user-1" } },
      shouldRecordInteraction: true,
    });

    const response = await callRoute();

    expect(processProfileView).toHaveBeenCalledWith({
      user: { id: "user-1", username: "john" },
      viewerId: viewer.id,
      requestId: "req-record",
      route: "/api/users/profile",
    });
    expect(recordInteraction).toHaveBeenCalledWith({
      actorId: viewer.id,
      targetUserId: "user-1",
      type: "profileVisit",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { profile: { id: "user-1" } },
      message: userMessages.success,
    });
  });

  it("logs error when recording interaction fails", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-record-fail", log });
    processProfileView.mockResolvedValueOnce({
      payload: { profile: { id: "user-1" } },
      shouldRecordInteraction: true,
    });
    recordInteraction.mockRejectedValueOnce(new Error("db down"));

    await callRoute();

    expect(log.error).toHaveBeenCalledWith(
      { error: new Error("db down") },
      "Failed to record profile visit interaction"
    );
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    processProfileView.mockRejectedValueOnce(unexpected);
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
