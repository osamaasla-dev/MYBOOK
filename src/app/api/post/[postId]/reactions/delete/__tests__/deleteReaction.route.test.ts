import request from "supertest";
import { createTestServer } from "tests/testServer";
import { DELETE } from "../route";
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

jest.mock("@/features/parts/post/services/server/reactions", () => ({
  removePostReaction: jest.fn(),
}));

jest.mock("@/features/parts/post/utils/reaction", () => ({
  buildReactionResponsePayload: jest.fn(),
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

const { removePostReaction } = jest.requireMock(
  "@/features/parts/post/services/server/reactions"
) as {
  removePostReaction: jest.Mock;
};

const { buildReactionResponsePayload } = jest.requireMock(
  "@/features/parts/post/utils/reaction"
) as { buildReactionResponsePayload: jest.Mock };

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

const callRoute = (path = "/api/post/clpost123/reactions/delete") =>
  request(
    createTestServer((req: Request) => {
      const url = new URL(req.url);
      const postId = url.pathname.split("/")[3];
      const context = { params: Promise.resolve({ postId }) };
      return DELETE(req, context);
    })
  )
    .delete(path)
    .set("content-type", "application/json");

describe("/api/post/[postId]/react DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-react-delete",
      log: createMockLog(),
    });
    validateCuid.mockReturnValue({ success: true, data: "clpost123validated" });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    const result = {
      reaction: null,
      operation: "CANCEL",
      reactionsCount: 0,
      reactionSummary: {},
    };
    removePostReaction.mockResolvedValue(result);
    buildReactionResponsePayload.mockReturnValue({
      reaction: null,
      summary: {},
    });
    normalizeError.mockImplementation((err) => err);
  });

  it("returns 400 when postId invalid", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({
      requestId: "req-invalid",
      log,
    });
    validateCuid.mockReturnValueOnce({ success: false });

    const response = await callRoute("/api/post/bad-id/reactions/delete");

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
    expect(removePostReaction).not.toHaveBeenCalled();
  });

  it("removes reaction successfully", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-success", log });
    const reactionData = {
      reaction: null,
      operation: "CANCEL",
      reactionsCount: 10,
      reactionSummary: { LIKE: 5 },
    };
    removePostReaction.mockResolvedValueOnce(reactionData);
    const payload = { reaction: null, summary: { LIKE: 5 } };
    buildReactionResponsePayload.mockReturnValueOnce(payload);

    const response = await callRoute();

    expect(removePostReaction).toHaveBeenCalledWith({
      postId: "clpost123validated",
      userId: viewer.id,
    });
    expect(buildReactionResponsePayload).toHaveBeenCalledWith(reactionData);
    expect(log.info).toHaveBeenCalledWith(
      {
        postId: "clpost123validated",
        userId: viewer.id,
        operation: "CANCEL",
      },
      "reaction.removed"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: payload,
      message: postMessages.reactions.deleteSuccess,
    });
  });

  it("returns 404 when prisma reports missing record", async () => {
    const prismaError = new Error("missing record");
    removePostReaction.mockRejectedValueOnce(prismaError);
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
    removePostReaction.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await callRoute();

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Reaction remove failed"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
