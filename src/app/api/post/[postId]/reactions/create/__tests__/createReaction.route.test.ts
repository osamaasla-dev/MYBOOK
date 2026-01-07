import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { postMessages } from "@/lib/messages";

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

jest.mock("@/features/parts/post/services/server", () => ({
  validateReactionPayload: jest.fn(),
  persistPostReaction: jest.fn(),
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

const { validateReactionPayload, persistPostReaction } = jest.requireMock(
  "@/features/parts/post/services/server"
) as {
  validateReactionPayload: jest.Mock;
  persistPostReaction: jest.Mock;
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

const callRoute = (
  path = "/api/post/clpost123/reactions/create",
  body: Record<string, unknown> = { reaction: "LIKE" }
) =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const postId = url.pathname.split("/")[3];
      const context = { params: Promise.resolve({ postId }) };
      return POST(req, context);
    })
  )
    .post(path)
    .set("content-type", "application/json")
    .send(body);

describe("/api/post/[postId]/react POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-react",
      log: createMockLog(),
    });
    validateCuid.mockReturnValue({ success: true, data: "clpost123validated" });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    validateReactionPayload.mockResolvedValue({
      ok: true,
      data: { reaction: "LIKE" },
    });
    persistPostReaction.mockResolvedValue({
      operation: "created",
      reaction: { type: "LIKE" },
    });
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when postId invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post/bad-id/reactions/create");

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
    expect(response.body.message).toBe("unauthorized");
    expect(checkRateLimit).not.toHaveBeenCalled();
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
    expect(validateReactionPayload).not.toHaveBeenCalled();
  });

  it("returns validation response when payload invalid", async () => {
    const invalidResponse = apiResponse(
      false,
      null,
      "Invalid payload",
      400,
      "req-invalid"
    );
    validateReactionPayload.mockResolvedValueOnce({
      ok: false,
      response: invalidResponse,
    });

    const response = await callRoute(
      "/api/post/clpost123/reactions/create",
      {}
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "Invalid payload",
    });
    expect(persistPostReaction).not.toHaveBeenCalled();
  });

  it("creates reaction successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const result = {
      operation: "created",
      reaction: { type: "LIKE" },
    };
    persistPostReaction.mockResolvedValueOnce(result);

    const response = await callRoute();

    expect(validateReactionPayload).toHaveBeenCalledWith({
      request: expect.any(Request),
      log,
      requestId: "req-success",
    });
    expect(persistPostReaction).toHaveBeenCalledWith({
      postId: "clpost123validated",
      userId: viewer.id,
      reaction: "LIKE",
    });
    expect(log.info).toHaveBeenCalledWith(
      {
        postId: "clpost123validated",
        userId: viewer.id,
        operation: "created",
      },
      "reaction.created"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: result,
      message: postMessages.reactions.fetchSuccess,
    });
  });

  it("returns 404 when prisma reports missing record", async () => {
    const prismaError = new Error("missing record");
    persistPostReaction.mockRejectedValueOnce(prismaError);
    normalizeError.mockReturnValueOnce({ code: "P2025" });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(prismaError);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: postMessages.notFound,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    persistPostReaction.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "React route failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
