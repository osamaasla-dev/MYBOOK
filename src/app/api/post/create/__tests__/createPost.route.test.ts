import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/features/parts/post/services/server", () => ({
  validatePostPayload: jest.fn(),
  moderatePostContent: jest.fn(),
  processPostCreation: jest.fn(),
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

const { checkRateLimit } = jest.requireMock(
  "@/features/parts/ratelimit/services"
) as { checkRateLimit: jest.Mock };

const { validatePostPayload, moderatePostContent, processPostCreation } =
  jest.requireMock("@/features/parts/post/services/server") as {
    validatePostPayload: jest.Mock;
    moderatePostContent: jest.Mock;
    processPostCreation: jest.Mock;
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

const viewer = { id: "viewer-1", username: "viewer" };

const callRoute = (body: Record<string, unknown> = { content: "Hello" }) =>
  request(createTestServer((req: Request) => POST(req)))
    .post("/api/post/create")
    .set("content-type", "application/json")
    .send(body);

describe("/api/post/create POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-post-create",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    validatePostPayload.mockResolvedValue({
      ok: true,
      data: { content: "Hello", media: [] },
      cleanupMedia: jest.fn(),
    });
    moderatePostContent.mockResolvedValue({ ok: true });
    processPostCreation.mockResolvedValue({ id: "post-1" });
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

    const response = await callRoute();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("unauthorized");
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("bubbles rate limit response when user exceeded quota", async () => {
    const rateResponse = apiResponse(false, {}, "Rate limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await callRoute();

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rate limited",
    });
    expect(validatePostPayload).not.toHaveBeenCalled();
  });

  it("returns payload validation response on invalid body", async () => {
    const invalidResponse = apiResponse(
      false,
      {},
      "Invalid payload",
      400,
      "req-invalid"
    );
    validatePostPayload.mockResolvedValueOnce({
      ok: false,
      response: invalidResponse,
    });

    const response = await callRoute({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Invalid payload",
    });
    expect(moderatePostContent).not.toHaveBeenCalled();
  });

  it("returns moderation response when moderation fails", async () => {
    const moderationResponse = apiResponse(
      false,
      {},
      "Rejected",
      400,
      "req-moderation"
    );
    moderatePostContent.mockResolvedValueOnce({
      ok: false,
      response: moderationResponse,
    });

    const response = await callRoute();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rejected",
    });
    expect(processPostCreation).not.toHaveBeenCalled();
  });

  it("creates post successfully", async () => {
    processPostCreation.mockResolvedValueOnce({
      id: "post-1",
      content: "Hello",
    });

    const response = await callRoute();

    expect(processPostCreation).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { id: "post-1", content: "Hello" },
      message: postMessages.created,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    processPostCreation.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Create post handler failed"
    );
    expect(response.status).toBe(503);
    expect(response.body.message).toBe("service-down");
  });
});
