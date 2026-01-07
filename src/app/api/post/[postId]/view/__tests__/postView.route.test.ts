import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { genericMessages, postMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/schemas/ids", () => ({
  validateCuid: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/features/parts/post/utils/views", () => ({
  resolvePostViewIdentity: jest.fn(),
  acquirePostViewLock: jest.fn(),
  enqueuePendingPostView: jest.fn(),
}));

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

const { checkRateLimit } = jest.requireMock(
  "@/features/parts/ratelimit/services"
) as { checkRateLimit: jest.Mock };

const { resolvePostViewIdentity, acquirePostViewLock, enqueuePendingPostView } =
  jest.requireMock("@/features/parts/post/utils/views") as {
    resolvePostViewIdentity: jest.Mock;
    acquirePostViewLock: jest.Mock;
    enqueuePendingPostView: jest.Mock;
  };

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

const identity = {
  viewerKey: "viewer-key",
  viewerId: "viewer-1",
  sessionHash: "sess-hash",
  ip: "1.1.1.1",
  countryCode: "EG",
  userAgent: "agent",
};

const callRoute = (path = "/api/post/clpost123/view") =>
  request(
    createTestServer((req: Request) => {
      const segments = new URL(req.url).pathname.split("/");
      const postId = segments[3];
      const context = {
        params: Promise.resolve({ postId }),
      };
      return POST(req, context);
    })
  )
    .post(path)
    .set("x-forwarded-for", "1.1.1.1");

describe("/api/post/[postId]/view POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-view",
      log: createMockLog(),
    });
    validateCuid.mockReturnValue({ success: true, data: "clpost123validated" });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    resolvePostViewIdentity.mockReturnValue(identity);
    checkRateLimit.mockResolvedValue({ ok: true });
    acquirePostViewLock.mockResolvedValue(true);
    enqueuePendingPostView.mockResolvedValue(undefined);
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when postId invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post/bad-id/view");

    expect(validateCuid).toHaveBeenCalledWith("bad-id");
    expect(log.warn).toHaveBeenCalledWith(postMessages.invalidPayload);
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: postMessages.invalidPayload,
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
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(resolvePostViewIdentity).not.toHaveBeenCalled();
  });

  it("returns rate limit response when user exceeded quota", async () => {
    const rateResponse = apiResponse(false, {}, "Rate limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await callRoute();

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rate limited",
    });
    expect(acquirePostViewLock).not.toHaveBeenCalled();
  });

  it("deduplicates when lock already held", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-dupe", log });
    acquirePostViewLock.mockResolvedValueOnce(false);

    const response = await callRoute();

    expect(acquirePostViewLock).toHaveBeenCalledWith(
      "clpost123validated",
      identity.viewerKey,
      undefined,
      log
    );
    expect(log.debug).toHaveBeenCalledWith(
      { postId: "clpost123", viewerKey: identity.viewerKey },
      "Duplicate view"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { deduplicated: true },
      message: genericMessages.success,
    });
    expect(enqueuePendingPostView).not.toHaveBeenCalled();
  });

  it("enqueues view successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });

    const response = await callRoute();

    expect(enqueuePendingPostView).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: "clpost123validated",
        viewerId: identity.viewerId,
        sessionHash: identity.sessionHash,
        ip: identity.ip,
        countryCode: identity.countryCode,
        userAgent: identity.userAgent,
      }),
      log
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { queued: true },
      message: genericMessages.success,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("redis down");
    enqueuePendingPostView.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "View route failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
