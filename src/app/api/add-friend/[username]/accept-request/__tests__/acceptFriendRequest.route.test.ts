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
  acceptFriendRequest: jest.fn(),
}));

jest.mock("@/features/parts/interaction/services", () => ({
  adjustRelationshipSnapshot: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareFriendAction } = jest.requireMock("../../shared") as {
  prepareFriendAction: jest.Mock;
};

const { acceptFriendRequest } = jest.requireMock(
  "@/features/parts/addFriend/services/server"
) as {
  acceptFriendRequest: jest.Mock;
};

const { adjustRelationshipSnapshot } = jest.requireMock(
  "@/features/parts/interaction/services"
) as {
  adjustRelationshipSnapshot: jest.Mock;
};

const { prisma } = jest.requireMock("@/lib/prisma") as {
  prisma: { $transaction: jest.Mock };
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

describe("/api/add-friend/[username]/accept-request POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue(undefined);
  });

  it("short-circuits when preparation fails", async () => {
    const failureResponse = apiResponse(
      false,
      {},
      "fail",
      400,
      "req-short-circuit"
    );
    prepareFriendAction.mockResolvedValue({
      ok: false,
      response: failureResponse,
    });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/accept-request")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(acceptFriendRequest).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("accepts the request and updates both relationship snapshots", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-123",
      log,
      viewerId: "viewer-1",
      viewerName: "Viewer",
      viewerUsername: "viewer",
      target: {
        id: "target-1",
        username: "target",
        name: "Target",
      },
    };

    const txClient = { tx: true };
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => unknown) => cb(txClient)
    );

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    acceptFriendRequest.mockResolvedValue({
      status: "ACCEPTED",
      requestId: "friend-request-1",
    });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/accept-request")
      .send({});

    expect(acceptFriendRequest).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      viewerName: "Viewer",
      requesterId: "target-1",
      requesterUsername: "target",
      requesterName: "Target",
    });

    expect(adjustRelationshipSnapshot).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        actorId: "viewer-1",
        targetUserId: "target-1",
        isFriend: true,
        isFollowing: true,
        prismaClient: txClient,
      })
    );
    expect(adjustRelationshipSnapshot).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        actorId: "target-1",
        targetUserId: "viewer-1",
        isFriend: true,
        isFollowing: true,
        prismaClient: txClient,
      })
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "ACCEPTED", requestId: "friend-request-1" },
      message: friendMessages.FEEDBACK.acceptRequestSuccess,
    });
  });

  it("returns normalized error when acceptance fails", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-500",
      log,
      viewerId: "viewer-1",
      viewerName: "Viewer",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };

    const serviceError = new Error("Service failure");
    prepareFriendAction.mockResolvedValue({ ok: true, context });
    acceptFriendRequest.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({
      status: 422,
      message: "cannot-accept",
    });

    const response = await serverFactory()
      .post("/api/add-friend/target-user/accept-request")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 422 },
      "Accept friend request failed"
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-accept",
    });
  });
});
