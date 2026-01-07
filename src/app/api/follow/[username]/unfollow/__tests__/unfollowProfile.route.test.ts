import request from "supertest";
import { createTestServer } from "tests/testServer";
import { DELETE } from "../route";
import type { FollowRouteContext } from "../../shared";
import { followMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";

const buildRouteContext = (req: Request): FollowRouteContext => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const username = decodeURIComponent(segments[segments.length - 2] ?? "");
  return { params: Promise.resolve({ username }) };
};

const DELETE_WRAPPER = (req: Request) => DELETE(req, buildRouteContext(req));

jest.mock("../../shared", () => ({
  prepareFollowAction: jest.fn(),
}));

jest.mock("@/features/parts/follow/services/server", () => ({
  unfollowProfile: jest.fn(),
}));

jest.mock("@/features/parts/interaction/services", () => ({
  adjustRelationshipSnapshot: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareFollowAction } = jest.requireMock("../../shared") as {
  prepareFollowAction: jest.Mock;
};

const { unfollowProfile } = jest.requireMock(
  "@/features/parts/follow/services/server"
) as { unfollowProfile: jest.Mock };

const { adjustRelationshipSnapshot } = jest.requireMock(
  "@/features/parts/interaction/services"
) as {
  adjustRelationshipSnapshot: jest.Mock;
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

describe("/api/follow/[username]/unfollow DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("short-circuits when preparation fails", async () => {
    const failureResponse = apiResponse(false, {}, "fail", 400, "req-short");
    prepareFollowAction.mockResolvedValue({
      ok: false,
      response: failureResponse,
    });

    const response = await serverFactory()
      .delete("/api/follow/target-user/unfollow")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(unfollowProfile).not.toHaveBeenCalled();
    expect(adjustRelationshipSnapshot).not.toHaveBeenCalled();
  });

  it("unfollows and updates relationship snapshot", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-unfollow",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target" },
    };
    prepareFollowAction.mockResolvedValue({ ok: true, context });
    unfollowProfile.mockResolvedValue({ status: "UNFOLLOWED" });

    const response = await serverFactory()
      .delete("/api/follow/target-user/unfollow")
      .send({});

    expect(unfollowProfile).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      targetUserId: "target-1",
      targetUsername: "target",
    });
    expect(adjustRelationshipSnapshot).toHaveBeenCalledWith({
      actorId: "viewer-1",
      targetUserId: "target-1",
      isFollowing: false,
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "UNFOLLOWED" },
      message: followMessages.FEEDBACK.unfollowSuccess,
    });
  });

  it("returns normalized error when unfollowProfile fails", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-500",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target" },
    };
    const serviceError = new Error("Service failure");
    prepareFollowAction.mockResolvedValue({ ok: true, context });
    unfollowProfile.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({
      status: 422,
      message: "cannot-unfollow",
    });

    const response = await serverFactory()
      .delete("/api/follow/target-user/unfollow")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 422 },
      "Unfollow request failed"
    );
    expect(adjustRelationshipSnapshot).not.toHaveBeenCalled();
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-unfollow",
    });
  });
});
