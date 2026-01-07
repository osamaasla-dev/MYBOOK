import request from "supertest";
import { createTestServer } from "tests/testServer";
import { PUT } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import profileMessages from "@/lib/messages/profile";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/features/pages/profile/schemas", () => ({
  updateProfileSchema: {
    safeParse: jest.fn(),
  },
}));

jest.mock("@/features/pages/profile/services/server", () => ({
  deleteUploadedProfileMedia: jest.fn(),
  extractUploadedProfileMedia: jest.fn(),
  moderateProfileContent: jest.fn(),
  processProfileUpdate: jest.fn(),
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

const { updateProfileSchema } = jest.requireMock(
  "@/features/pages/profile/schemas"
) as { updateProfileSchema: { safeParse: jest.Mock } };

const {
  deleteUploadedProfileMedia,
  extractUploadedProfileMedia,
  moderateProfileContent,
  processProfileUpdate,
} = jest.requireMock("@/features/pages/profile/services/server") as {
  deleteUploadedProfileMedia: jest.Mock;
  extractUploadedProfileMedia: jest.Mock;
  moderateProfileContent: jest.Mock;
  processProfileUpdate: jest.Mock;
};

const { normalizeError } = jest.requireMock("@/lib/http/normalizeError") as {
  normalizeError: jest.Mock;
};

const viewer = { id: "viewer-1", name: "Viewer", username: "viewer" };
const buildRequestBody = () => ({
  bio: "Hello",
  avatarUrl: "https://cdn/avatar.jpg",
  coverUrl: "https://cdn/cover.jpg",
});

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const serverFactory = () =>
  request(createTestServer((req: Request) => PUT(req)));

describe("/api/me/profile PUT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-profile",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    extractUploadedProfileMedia.mockReturnValue(["public-1"]);
    deleteUploadedProfileMedia.mockResolvedValue(undefined);
    updateProfileSchema.safeParse.mockImplementation((payload) => ({
      success: true,
      data: payload,
    }));
    moderateProfileContent.mockResolvedValue({ ok: true });
    processProfileUpdate.mockResolvedValue({ id: "viewer-1", bio: "Hello" });
    normalizeError.mockReturnValue({ status: 500, message: "boom" });
  });

  it("returns session response when session invalid", async () => {
    const sessionResponse = apiResponse(
      false,
      {},
      "unauthorized",
      401,
      "req-session"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: sessionResponse,
    });

    const response = await serverFactory()
      .put("/api/me/profile")
      .send(buildRequestBody());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns rate limit response when user exceeded quota", async () => {
    const rateResponse = apiResponse(false, {}, "Rate limited", 429, "req-rl");
    checkRateLimit.mockResolvedValueOnce({ ok: false, response: rateResponse });

    const response = await serverFactory()
      .put("/api/me/profile")
      .send(buildRequestBody());

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rate limited",
    });
    expect(updateProfileSchema.safeParse).not.toHaveBeenCalled();
  });

  it("cleans up uploaded media and returns 400 when payload invalid", async () => {
    updateProfileSchema.safeParse.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: "Invalid bio" }] },
    });

    const response = await serverFactory()
      .put("/api/me/profile")
      .send(buildRequestBody());

    expect(deleteUploadedProfileMedia).toHaveBeenCalledWith(
      ["public-1"],
      expect.any(Object),
      { reason: "profile-invalid-payload" }
    );
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid bio");
  });

  it("returns moderation response when moderation fails", async () => {
    const moderationResponse = apiResponse(
      false,
      {},
      "Rejected",
      400,
      "req-moderation"
    );
    moderateProfileContent.mockResolvedValueOnce({
      ok: false,
      response: moderationResponse,
    });

    const response = await serverFactory()
      .put("/api/me/profile")
      .send(buildRequestBody());

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "Rejected",
    });
    expect(processProfileUpdate).not.toHaveBeenCalled();
  });

  it("updates profile successfully", async () => {
    processProfileUpdate.mockResolvedValueOnce({
      id: "viewer-1",
      bio: "Hello world",
    });

    const response = await serverFactory()
      .put("/api/me/profile")
      .send(buildRequestBody());

    expect(processProfileUpdate).toHaveBeenCalledWith({
      viewer,
      profileData: expect.objectContaining({ bio: "Hello" }),
      log: expect.any(Object),
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { id: "viewer-1", bio: "Hello world" },
      message: profileMessages.update.success,
    });
    expect(deleteUploadedProfileMedia).not.toHaveBeenCalled();
  });

  it("normalizes unexpected errors and runs cleanup", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    processProfileUpdate.mockRejectedValueOnce(new Error("db down"));
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory()
      .put("/api/me/profile")
      .send(buildRequestBody());

    expect(deleteUploadedProfileMedia).toHaveBeenCalledWith(["public-1"], log, {
      reason: "profile-unexpected-error",
    });
    expect(normalizeError).toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      { err: expect.any(Object), status: 503 },
      "service-down"
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "service-down",
    });
  });
});
