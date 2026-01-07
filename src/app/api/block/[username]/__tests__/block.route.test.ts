import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST, DELETE } from "../route";
import { blockMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";
type BlockRouteContext = {
  params: Promise<{ username: string }>;
};
const buildRouteContext = (req: Request): BlockRouteContext => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const username = decodeURIComponent(segments[segments.length - 2] ?? "");
  return { params: Promise.resolve({ username }) };
};

const POST_WRAPPER = (req: Request) => POST(req, buildRouteContext(req));
const DELETE_WRAPPER = (req: Request) => DELETE(req, buildRouteContext(req));

jest.mock("@/features/parts/block/services/server", () => ({
  prepareBlockAction: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareBlockAction } = jest.requireMock(
  "@/features/parts/block/services/server"
) as { prepareBlockAction: jest.Mock };

const { blockUser, unblockUser } = jest.requireMock(
  "@/features/parts/block/services/server"
) as {
  blockUser: jest.Mock;
  unblockUser: jest.Mock;
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

const serverFactory = () => ({
  post: () => request(createTestServer(POST_WRAPPER)),
  delete: () => request(createTestServer(DELETE_WRAPPER)),
});

describe("/api/block/[username] routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST block", () => {
    it("short-circuits when preparation fails", async () => {
      const failureResponse = apiResponse(
        false,
        {},
        "fail",
        400,
        "req-block-short"
      );
      prepareBlockAction.mockResolvedValue({
        ok: false,
        response: failureResponse,
      });

      const response = await serverFactory()
        .post()
        .post("/api/block/target-user")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: {},
        message: "fail",
      });
      expect(blockUser).not.toHaveBeenCalled();
    });

    it("blocks user and returns success payload", async () => {
      const log = createMockLog();
      const context = {
        requestId: "req-block",
        log,
        viewer: { id: "viewer-1", username: "viewer" },
        target: { id: "target-1", username: "target" },
      };
      prepareBlockAction.mockResolvedValue({ ok: true, context });
      blockUser.mockResolvedValue({ blockedUserId: "target-1" });

      const response = await serverFactory()
        .post()
        .post("/api/block/target-user")
        .send({});

      expect(blockUser).toHaveBeenCalledWith({
        viewerId: "viewer-1",
        viewerUsername: "viewer",
        targetProfile: {
          id: "target-1",
          username: "target",
        },
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { blockedUserId: "target-1" },
        message: blockMessages.FEEDBACK.success,
      });
    });

    it("returns normalized error when blockUser fails", async () => {
      const log = createMockLog();
      const context = {
        requestId: "req-block-fail",
        log,
        viewer: { id: "viewer-1", username: "viewer" },
        target: { id: "target-1", username: "target" },
      };
      const serviceError = new Error("block fail");
      prepareBlockAction.mockResolvedValue({ ok: true, context });
      blockUser.mockRejectedValue(serviceError);
      normalizeError.mockReturnValue({
        status: 422,
        message: "cannot-block",
      });

      const response = await serverFactory()
        .post()
        .post("/api/block/target-user")
        .send({});

      expect(normalizeError).toHaveBeenCalledWith(serviceError);
      expect(log.error).toHaveBeenCalledWith(
        { err: serviceError, status: 422 },
        "Block request failed"
      );
      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        success: false,
        data: {},
        message: "cannot-block",
      });
    });
  });

  describe("DELETE unblock", () => {
    it("short-circuits when preparation fails", async () => {
      const failureResponse = apiResponse(
        false,
        {},
        "fail",
        400,
        "req-unblock-short"
      );
      prepareBlockAction.mockResolvedValue({
        ok: false,
        response: failureResponse,
      });

      const response = await serverFactory()
        .delete()
        .delete("/api/block/target-user")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        data: {},
        message: "fail",
      });
      expect(unblockUser).not.toHaveBeenCalled();
    });

    it("unblocks user and returns success payload", async () => {
      const log = createMockLog();
      const context = {
        requestId: "req-unblock",
        log,
        viewer: { id: "viewer-1", username: "viewer" },
        target: { id: "target-1", username: "target" },
      };
      prepareBlockAction.mockResolvedValue({ ok: true, context });
      unblockUser.mockResolvedValue({ unblockedUserId: "target-1" });

      const response = await serverFactory()
        .delete()
        .delete("/api/block/target-user")
        .send({});

      expect(unblockUser).toHaveBeenCalledWith({
        viewerId: "viewer-1",
        viewerUsername: "viewer",
        targetProfile: {
          id: "target-1",
          username: "target",
        },
      });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { unblockedUserId: "target-1" },
        message: blockMessages.FEEDBACK.unblocked,
      });
    });

    it("returns normalized error when unblockUser fails", async () => {
      const log = createMockLog();
      const context = {
        requestId: "req-unblock-fail",
        log,
        viewer: { id: "viewer-1", username: "viewer" },
        target: { id: "target-1", username: "target" },
      };
      const serviceError = new Error("unblock fail");
      prepareBlockAction.mockResolvedValue({ ok: true, context });
      unblockUser.mockRejectedValue(serviceError);
      normalizeError.mockReturnValue({
        status: 500,
        message: "cannot-unblock",
      });

      const response = await serverFactory()
        .delete()
        .delete("/api/block/target-user")
        .send({});

      expect(normalizeError).toHaveBeenCalledWith(serviceError);
      expect(log.error).toHaveBeenCalledWith(
        { err: serviceError, status: 500 },
        "Unblock request failed"
      );
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        data: {},
        message: "cannot-unblock",
      });
    });
  });
});
