import request from "supertest";
import { createTestServer } from "tests/testServer";
import { DELETE } from "../route";
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

jest.mock("@/schemas/ids", () => ({
  validateCuid: jest.fn(),
}));

jest.mock("@/features/parts/post/services/server/deletePost", () => ({
  deletePost: jest.fn(),
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

const { validateCuid } = jest.requireMock("@/schemas/ids") as {
  validateCuid: jest.Mock;
};

const { deletePost } = jest.requireMock(
  "@/features/parts/post/services/server/deletePost"
) as { deletePost: jest.Mock };

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

const serverFactory = () =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const segments = url.pathname.split("/");
      const postId = segments[3] ?? "";
      const context = {
        params: Promise.resolve({ postId }),
      };
      return DELETE(req, context);
    })
  );

describe("/api/post/[postId]/delete DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-delete",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    validateCuid.mockReturnValue({ success: true, data: "clpost1234567890" });
    deletePost.mockResolvedValue({});
    normalizeError.mockImplementation((err) => err);
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

    const response = await serverFactory()
      .delete("/api/post/clpost123/delete")
      .send();

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("unauthorized");
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns rate limit response when user exceeded quota", async () => {
    const rateResponse = apiResponse(false, {}, "Rate limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await serverFactory()
      .delete("/api/post/clpost123/delete")
      .send();

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rate limited",
    });
    expect(validateCuid).not.toHaveBeenCalled();
  });

  it("returns 400 when postId invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-invalid", log });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await serverFactory()
      .delete("/api/post/bad-id/delete")
      .send();

    expect(validateCuid).toHaveBeenCalledWith("bad-id");
    expect(log.warn).toHaveBeenCalledWith(postMessages.delete.invalidParams);
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(postMessages.delete.invalidParams);
    expect(deletePost).not.toHaveBeenCalled();
  });

  it("returns deletePost error response when service fails", async () => {
    const serviceResponse = apiResponse(
      false,
      {},
      "not allowed",
      403,
      "req-service"
    );
    deletePost.mockResolvedValueOnce({ error: serviceResponse });

    const response = await serverFactory()
      .delete("/api/post/clpost123/delete")
      .send();

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "not allowed",
    });
  });

  it("deletes post successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    deletePost.mockResolvedValueOnce({});

    const response = await serverFactory()
      .delete("/api/post/clpostA/delete")
      .send();

    expect(deletePost).toHaveBeenCalledWith({
      postId: "clpost1234567890",
      userId: viewer.id,
      log,
      requestId: "req-success",
    });
    expect(log.info).toHaveBeenCalledWith(
      { postId: "clpost1234567890", userId: viewer.id },
      postMessages.delete.success
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: null,
      message: postMessages.delete.success,
    });
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("db down");
    deletePost.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory()
      .delete("/api/post/clpost123/delete")
      .send();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { error: { status: 503, message: "service-down" } },
      postMessages.unexpectedError
    );
    expect(response.status).toBe(500);
    expect(response.body.message).toBe(postMessages.unexpectedError);
  });
});
