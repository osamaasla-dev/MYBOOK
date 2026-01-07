import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { moderationMessages } from "@/lib/messages";
import {
  MissingModerationAPIKeyError,
  ModerationProviderError,
} from "@/features/parts/moderation/services/server";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/parts/moderation/schemas/checkModerationSchema", () => ({
  checkModerationSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock("@/features/parts/moderation/services/server", () => {
  const actual = jest.requireActual(
    "@/features/parts/moderation/services/server"
  );
  return {
    ...actual,
    checkModeration: jest.fn(),
  };
});

jest.mock("@/features/parts/moderation/utils", () => ({
  decideModerationAction: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { checkModerationSchema } = jest.requireMock(
  "@/features/parts/moderation/schemas/checkModerationSchema"
) as { checkModerationSchema: { safeParse: jest.Mock } };

const { checkModeration } = jest.requireMock(
  "@/features/parts/moderation/services/server"
) as {
  checkModeration: jest.Mock;
};

const { decideModerationAction } = jest.requireMock(
  "@/features/parts/moderation/utils"
) as { decideModerationAction: jest.Mock };

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
  request(createTestServer((req: Request) => POST(req)));

describe("/api/moderation/check POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-moderation",
      log: createMockLog(),
    });
    checkModerationSchema.safeParse.mockReturnValue({
      success: true,
      data: { content: "hello", context: { type: "post" } },
    });
    checkModeration.mockResolvedValue({
      severity: "low",
      context: { type: "post" },
    });
    decideModerationAction.mockReturnValue({
      status: "allow",
      threshold: "medium",
    });
    normalizeError.mockReturnValue({ status: 500, message: "unexpected" });
  });

  it("returns 400 when payload fails validation", async () => {
    checkModerationSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: "invalid payload" }] },
    });

    const response = await serverFactory()
      .post("/api/moderation/check")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("invalid payload");
    expect(checkModeration).not.toHaveBeenCalled();
  });

  it("checks moderation and logs decision", async () => {
    const response = await serverFactory()
      .post("/api/moderation/check")
      .send({ content: "post", context: { type: "post" } });

    expect(checkModeration).toHaveBeenCalledWith("hello", { type: "post" });
    expect(decideModerationAction).toHaveBeenCalledWith(
      { type: "post" },
      "low"
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { severity: "low", context: { type: "post" } },
      message: moderationMessages.success,
    });
  });

  it("handles missing provider key error", async () => {
    const error = new MissingModerationAPIKeyError();
    checkModeration.mockRejectedValueOnce(error);

    const response = await serverFactory()
      .post("/api/moderation/check")
      .send({ content: "post" });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(moderationMessages.missingKey);
  });

  it("handles provider errors with friendly messages", async () => {
    const error = new ModerationProviderError(
      429,
      "provider rate limit",
      JSON.stringify({ detail: "rate limit" })
    );
    checkModeration.mockRejectedValueOnce(error);

    const response = await serverFactory()
      .post("/api/moderation/check")
      .send({ content: "post" });

    expect(response.status).toBe(429);
    expect(response.body.message).toBe(moderationMessages.rateLimited);
  });

  it("normalizes unexpected errors", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const unexpected = new Error("upstream down");
    checkModeration.mockRejectedValueOnce(unexpected);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory()
      .post("/api/moderation/check")
      .send({ content: "post" });

    expect(normalizeError).toHaveBeenCalledWith(unexpected);
    expect(log.error).toHaveBeenCalledWith(
      { err: { status: 503, message: "service-down" }, status: 503 },
      "Moderation handler failed"
    );
    expect(response.status).toBe(503);
    expect(response.body.message).toBe("service-down");
  });
});
