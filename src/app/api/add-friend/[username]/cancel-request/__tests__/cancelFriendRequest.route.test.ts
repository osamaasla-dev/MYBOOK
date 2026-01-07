import request from "supertest";
import { createTestServer } from "tests/testServer";
import { DELETE } from "../route";
import type { FriendRouteContext } from "../../shared";
import { friendMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";

const buildRouteContext = (request: Request): FriendRouteContext => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const username = decodeURIComponent(segments[segments.length - 2] ?? "");

  return {
    params: Promise.resolve({ username }),
  };
};

const DELETE_WRAPPER = (req: Request) => DELETE(req, buildRouteContext(req));

jest.mock("../../shared", () => ({
  prepareFriendAction: jest.fn(),
}));

jest.mock("@/features/parts/addFriend/services/server", () => ({
  cancelFriendRequest: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareFriendAction } = jest.requireMock("../../shared") as {
  prepareFriendAction: jest.Mock;
};

const { cancelFriendRequest } = jest.requireMock(
  "@/features/parts/addFriend/services/server"
) as {
  cancelFriendRequest: jest.Mock;
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

const serverFactory = () => request(createTestServer(DELETE_WRAPPER));

describe("/api/add-friend/[username]/cancel-request DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("short-circuits when preparation fails", async () => {
    const failureResponse = apiResponse(
      false,
      {},
      "fail",
      400,
      "req-cancel-short"
    );
    prepareFriendAction.mockResolvedValue({
      ok: false,
      response: failureResponse,
    });

    const response = await serverFactory()
      .delete("/api/add-friend/target-user/cancel-request")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(cancelFriendRequest).not.toHaveBeenCalled();
  });

  it("cancels pending request and returns success payload", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-cancel",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    cancelFriendRequest.mockResolvedValue({
      status: "CANCELED",
      requestId: "friend-request-1",
    });

    const response = await serverFactory()
      .delete("/api/add-friend/target-user/cancel-request")
      .send({});

    expect(cancelFriendRequest).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      targetUserId: "target-1",
      targetUsername: "target",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "CANCELED", requestId: "friend-request-1" },
      message: friendMessages.FEEDBACK.cancelRequestSuccess,
    });
  });

  it("returns normalized error when cancel service throws", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-cancel-fail",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };
    const serviceError = new Error("service failure");

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    cancelFriendRequest.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({ status: 409, message: "cannot-cancel" });

    const response = await serverFactory()
      .delete("/api/add-friend/target-user/cancel-request")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 409 },
      "Cancel friend request failed"
    );
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-cancel",
    });
  });
});
