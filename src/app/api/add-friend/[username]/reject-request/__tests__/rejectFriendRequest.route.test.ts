import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
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

const POST_WRAPPER = (req: Request) => POST(req, buildRouteContext(req));

jest.mock("../../shared", () => ({
  prepareFriendAction: jest.fn(),
}));

jest.mock("@/features/parts/addFriend/services/server", () => ({
  rejectFriendRequest: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareFriendAction } = jest.requireMock("../../shared") as {
  prepareFriendAction: jest.Mock;
};

const { rejectFriendRequest } = jest.requireMock(
  "@/features/parts/addFriend/services/server"
) as {
  rejectFriendRequest: jest.Mock;
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

describe("/api/add-friend/[username]/reject-request POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("short-circuits when preparation fails", async () => {
    const failureResponse = apiResponse(
      false,
      {},
      "fail",
      400,
      "req-reject-short"
    );
    prepareFriendAction.mockResolvedValue({
      ok: false,
      response: failureResponse,
    });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/reject-request")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(rejectFriendRequest).not.toHaveBeenCalled();
  });

  it("rejects the friend request and returns success", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-reject",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    rejectFriendRequest.mockResolvedValue({
      status: "REJECTED",
      requestId: "friend-request-1",
    });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/reject-request")
      .send({});

    expect(rejectFriendRequest).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      requesterId: "target-1",
      requesterUsername: "target",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "REJECTED", requestId: "friend-request-1" },
      message: friendMessages.FEEDBACK.rejectRequestSuccess,
    });
  });

  it("returns normalized error when reject service throws", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-reject-fail",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };
    const serviceError = new Error("service failure");

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    rejectFriendRequest.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({ status: 422, message: "cannot-reject" });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/reject-request")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 422 },
      "Reject friend request failed"
    );
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-reject",
    });
  });
});
