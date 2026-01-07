import { prepareBlockAction } from "../prepareBlockAction";

// Mock dependencies
jest.mock("@/lib/apiResponse", () => ({
  apiResponse: jest.fn(),
}));

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/pages/profile/utils", () => ({
  fetchProfileUserByUsername: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/features/parts/block/utils/server", () => ({
  isBlock: jest.fn(),
}));

import { apiResponse } from "@/lib/apiResponse";
import { getRequestLog } from "@/lib/request-log";
import { fetchProfileUserByUsername } from "@/features/pages/profile/utils";
import { validateSession } from "@/features/services/server";
import { checkRateLimit } from "@/features/parts/ratelimit/services";
import { isBlock } from "@/features/parts/block/utils/server";

const mockApiResponse = apiResponse as jest.MockedFunction<typeof apiResponse>;
const mockGetRequestLog = getRequestLog as jest.MockedFunction<
  typeof getRequestLog
>;
const mockFetchProfileUserByUsername =
  fetchProfileUserByUsername as jest.MockedFunction<
    typeof fetchProfileUserByUsername
  >;
const mockValidateSession = validateSession as jest.MockedFunction<
  typeof validateSession
>;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;
const mockIsBlock = isBlock as jest.MockedFunction<typeof isBlock>;

describe("prepareBlockAction", () => {
  const mockRequest = new Request("http://localhost:3000/api/test", {
    method: "POST",
  });
  const mockParams = Promise.resolve({ username: "target_user" });
  const mockLog = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockViewer = {
    id: "viewer-123",
    username: "viewer_user",
  };

  const mockTargetProfile = {
    id: "target-456",
    username: "target_user",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockGetRequestLog as jest.Mock).mockResolvedValue({
      requestId: "req-123",
      log: mockLog,
    });
    (mockValidateSession as jest.Mock).mockResolvedValue({
      ok: true,
      user: mockViewer,
    });
    (mockCheckRateLimit as jest.Mock).mockResolvedValue({ ok: true });
    (mockFetchProfileUserByUsername as jest.Mock).mockResolvedValue(
      mockTargetProfile
    );
    (mockIsBlock as jest.Mock).mockResolvedValue({
      anyBlock: false,
      primaryBlocksSecondary: false,
      secondaryBlocksPrimary: false,
    });
    (mockApiResponse as jest.Mock).mockReturnValue(
      new Response("{}", { status: 200 })
    );
  });

  describe("successful preparation", () => {
    it("should prepare block action successfully", async () => {
      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.context.requestId).toBe("req-123");
        expect(result.context.log).toBe(mockLog);
        expect(result.context.viewer).toEqual(mockViewer);
        expect(result.context.target).toEqual(mockTargetProfile);
      }
    });

    it("should prepare unblock action successfully", async () => {
      (mockIsBlock as jest.Mock).mockResolvedValue({
        anyBlock: true,
        primaryBlocksSecondary: true,
        secondaryBlocksPrimary: false,
      });

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/unblock",
        action: "unblock",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.context.requestId).toBe("req-123");
        expect(result.context.viewer).toEqual(mockViewer);
        expect(result.context.target).toEqual(mockTargetProfile);
      }
    });

    it("should log the start of the request", async () => {
      await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(mockLog.info).toHaveBeenCalledWith("block request started");
    });
  });

  describe("session validation", () => {
    it("should return error response when session validation fails", async () => {
      const errorResponse = new Response("Unauthorized", { status: 401 });
      (mockValidateSession as jest.Mock).mockResolvedValue({
        ok: false,
        response: errorResponse,
      });

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response).toBe(errorResponse);
      }
    });
  });

  describe("rate limiting", () => {
    it("should return error response when rate limit is exceeded", async () => {
      const rateLimitResponse = new Response("Too Many Requests", {
        status: 429,
      });
      (mockCheckRateLimit as jest.Mock).mockResolvedValue({
        ok: false,
        response: rateLimitResponse,
      });

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response).toBe(rateLimitResponse);
      }
    });

    it("should call rate limit with correct parameters", async () => {
      await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(mockCheckRateLimit).toHaveBeenCalledWith({
        namespace: "block:actions",
        viewerId: "viewer-123",
        windowSeconds: 60,
        maxRequests: 10,
        log: mockLog,
        request: mockRequest,
        requestId: "req-123",
      });
    });
  });

  describe("target profile validation", () => {
    it("should return 404 when target profile is not found", async () => {
      (mockFetchProfileUserByUsername as jest.Mock).mockResolvedValue(null);

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(mockApiResponse).toHaveBeenCalledWith(
          false,
          {},
          "BLOCK_TARGET_NOT_FOUND",
          404,
          "req-123"
        );
      }
    });

    it("should log warning when target profile is not found", async () => {
      (mockFetchProfileUserByUsername as jest.Mock).mockResolvedValue(null);

      await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(mockLog.warn).toHaveBeenCalledWith("Target profile not found");
    });
  });

  describe("self-block prevention", () => {
    it("should return 400 when viewer attempts to block themselves", async () => {
      const selfProfile = {
        id: "viewer-123",
        username: "viewer_user",
      };
      (mockFetchProfileUserByUsername as jest.Mock).mockResolvedValue(
        selfProfile
      );

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(mockApiResponse).toHaveBeenCalledWith(
          false,
          {},
          "BLOCK_SELF_NOT_ALLOWED",
          400,
          "req-123"
        );
      }
    });

    it("should return 400 when viewer attempts to unblock themselves", async () => {
      const selfProfile = {
        id: "viewer-123",
        username: "viewer_user",
      };
      (mockFetchProfileUserByUsername as jest.Mock).mockResolvedValue(
        selfProfile
      );

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/unblock",
        action: "unblock",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(mockApiResponse).toHaveBeenCalledWith(
          false,
          {},
          "BLOCK_SELF_NOT_ALLOWED",
          400,
          "req-123"
        );
      }
    });

    it("should log warning when viewer attempts self-block", async () => {
      const selfProfile = {
        id: "viewer-123",
        username: "viewer_user",
      };
      (mockFetchProfileUserByUsername as jest.Mock).mockResolvedValue(
        selfProfile
      );

      await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(mockLog.warn).toHaveBeenCalledWith(
        "Viewer attempted to block self"
      );
    });
  });

  describe("block status validation", () => {
    it("should return 400 when attempting to block already blocked user", async () => {
      (mockIsBlock as jest.Mock).mockResolvedValue({
        anyBlock: true,
        primaryBlocksSecondary: true,
        secondaryBlocksPrimary: false,
      });

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(mockApiResponse).toHaveBeenCalledWith(
          false,
          {},
          "BLOCK_ALREADY_EXISTS",
          400,
          "req-123"
        );
      }
    });

    it("should return 400 when attempting to unblock user not blocked", async () => {
      (mockIsBlock as jest.Mock).mockResolvedValue({
        anyBlock: false,
        primaryBlocksSecondary: false,
        secondaryBlocksPrimary: false,
      });

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/unblock",
        action: "unblock",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(mockApiResponse).toHaveBeenCalledWith(
          false,
          {},
          "BLOCK_NOT_FOUND",
          400,
          "req-123"
        );
      }
    });

    it("should log warning when attempting to unblock user not blocked", async () => {
      (mockIsBlock as jest.Mock).mockResolvedValue({
        anyBlock: false,
        primaryBlocksSecondary: false,
        secondaryBlocksPrimary: false,
      });

      await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/unblock",
        action: "unblock",
      });

      expect(mockLog.warn).toHaveBeenCalledWith(
        { viewerId: "viewer-123", targetId: "target-456" },
        "Viewer attempted to unblock user they have not blocked"
      );
    });
  });

  describe("error handling", () => {
    it("should return 500 response when an unexpected error occurs", async () => {
      const error = new Error("Unexpected error");
      (mockValidateSession as jest.Mock).mockRejectedValue(error);

      const result = await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(mockApiResponse).toHaveBeenCalledWith(
          false,
          {},
          "BLOCK_FAILED",
          500,
          "req-123"
        );
      }
    });

    it("should log error when an unexpected error occurs", async () => {
      const error = new Error("Unexpected error");
      (mockValidateSession as jest.Mock).mockRejectedValue(error);

      await prepareBlockAction(mockRequest, mockParams, {
        route: "/api/block",
        action: "block",
      });

      expect(mockLog.error).toHaveBeenCalledWith(
        { error },
        "block preparation failed"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty username parameter", async () => {
      const emptyParams = Promise.resolve({ username: "" });
      (mockFetchProfileUserByUsername as jest.Mock).mockResolvedValue(null);

      const result = await prepareBlockAction(mockRequest, emptyParams, {
        route: "/api/block",
        action: "block",
      });

      expect(result.ok).toBe(false);
      expect(mockFetchProfileUserByUsername).toHaveBeenCalledWith("");
    });
  });
});
