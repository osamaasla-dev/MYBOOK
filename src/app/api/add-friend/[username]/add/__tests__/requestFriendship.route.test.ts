import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import type { FriendRouteContext } from "../../shared";
import { friendMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";

const buildRouteContext = (req: Request): FriendRouteContext => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const username = decodeURIComponent(segments[segments.length - 2] ?? "");

  return {
    params: Promise.resolve({ username }),
  };
};

const POST_WRAPPER = (req: Request) => POST(req, buildRouteContext(req));

jest.mock("../../shared", () => ({
  prepareFriendAction: jest.fn(),
}));

jest.mock("@/features/parts/addFriend/services/server", () => ({
  requestFriendship: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareFriendAction } = jest.requireMock("../../shared") as {
  prepareFriendAction: jest.Mock;
};

const { requestFriendship } = jest.requireMock(
  "@/features/parts/addFriend/services/server"
) as {
  requestFriendship: jest.Mock;
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

const serverFactory = () => request(createTestServer(POST_WRAPPER));

describe("/api/add-friend/[username]/add POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("short-circuits when preparation fails", async () => {
    const failureResponse = apiResponse(false, {}, "fail", 400, "req-fail");
    prepareFriendAction.mockResolvedValue({
      ok: false,
      response: failureResponse,
    });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/add")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(requestFriendship).not.toHaveBeenCalled();
  });

  it("creates a friend request and returns success response", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-200",
      log,
      viewerId: "viewer-1",
      viewerName: "Viewer",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    requestFriendship.mockResolvedValue({
      status: "REQUESTED",
      requestId: "friend-req-1",
    });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/add")
      .send({});

    expect(requestFriendship).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      viewerName: "Viewer",
      targetUserId: "target-1",
      targetUsername: "target",
      targetName: "Target",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "REQUESTED", requestId: "friend-req-1" },
      message: friendMessages.FEEDBACK.requestSuccess,
    });
  });

  it("returns normalized error when requestFriendship throws", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-500",
      log,
      viewerId: "viewer-1",
      viewerName: "Viewer",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };
    const serviceError = new Error("service failure");

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    requestFriendship.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({ status: 409, message: "duplicate" });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/add")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 409 },
      "Friend request failed"
    );
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "duplicate",
    });
  });
});
