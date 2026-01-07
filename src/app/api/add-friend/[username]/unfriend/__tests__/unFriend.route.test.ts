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
  unFriend: jest.fn(),
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

const { unFriend } = jest.requireMock(
  "@/features/parts/addFriend/services/server"
) as {
  unFriend: jest.Mock;
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

const serverFactory = () => request(createTestServer(DELETE_WRAPPER));

describe("/api/add-friend/[username]/unfriend DELETE", () => {
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
      "req-unfriend-short"
    );
    prepareFriendAction.mockResolvedValue({
      ok: false,
      response: failureResponse,
    });

    const response = await serverFactory()
      .delete("/api/add-friend/target-user/unfriend")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(unFriend).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("removes friend and updates relationship snapshots", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-unfriend",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };
    const txClient = { tx: true };
    prisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => unknown) => cb(txClient)
    );

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    unFriend.mockResolvedValue({ status: "REMOVED" });

    const response = await serverFactory()
      .delete("/api/add-friend/target-user/unfriend")
      .send({});

    expect(unFriend).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      targetUserId: "target-1",
      targetUsername: "target",
    });

    expect(adjustRelationshipSnapshot).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        actorId: "viewer-1",
        targetUserId: "target-1",
        isFriend: false,
        isFollowing: false,
        prismaClient: txClient,
      })
    );
    expect(adjustRelationshipSnapshot).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        actorId: "target-1",
        targetUserId: "viewer-1",
        isFriend: false,
        isFollowing: false,
        prismaClient: txClient,
      })
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "REMOVED" },
      message: friendMessages.FEEDBACK.unFriendSuccess,
    });
  });

  it("returns normalized error when unfriend fails", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-unfriend-fail",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target", name: "Target" },
    };
    const serviceError = new Error("Service failure");

    prepareFriendAction.mockResolvedValue({ ok: true, context });
    unFriend.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({
      status: 500,
      message: "cannot-unfriend",
    });

    const response = await serverFactory()
      .delete("/api/add-friend/target-user/unfriend")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 500 },
      "Unfriend action failed"
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-unfriend",
    });
  });
});
