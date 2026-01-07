import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import type { FollowRouteContext } from "../../shared";
import { followMessages } from "@/lib/messages";
import { apiResponse } from "@/lib/apiResponse";

const buildRouteContext = (req: Request): FollowRouteContext => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const username = decodeURIComponent(segments[segments.length - 2] ?? "");
  return { params: Promise.resolve({ username }) };
};

const POST_WRAPPER = (req: Request) => POST(req, buildRouteContext(req));

jest.mock("../../shared", () => ({
  prepareFollowAction: jest.fn(),
}));

jest.mock("@/features/parts/follow/services/server", () => ({
  followProfile: jest.fn(),
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

const { followProfile } = jest.requireMock(
  "@/features/parts/follow/services/server"
) as { followProfile: jest.Mock };

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

const serverFactory = () => request(createTestServer(POST_WRAPPER));

describe("/api/follow/[username]/follow POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("short-circuits when preparation fails", async () => {
    const failureResponse = apiResponse(
      false,
      {},
      "fail",
      400,
      "req-short-circuit"
    );
    prepareFollowAction.mockResolvedValue({
      ok: false,
      response: failureResponse,
    });

    const response = await serverFactory()
      .post("/api/follow/target-user/follow")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(followProfile).not.toHaveBeenCalled();
    expect(adjustRelationshipSnapshot).not.toHaveBeenCalled();
  });

  it("follows immediately and updates snapshot when service returns FOLLOWED", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-follow",
      log,
      viewerId: "viewer-1",
      viewerName: "Viewer",
      viewerUsername: "viewer",
      target: {
        id: "target-1",
        username: "target",
        name: "Target",
        isPrivate: false,
      },
    };
    prepareFollowAction.mockResolvedValue({ ok: true, context });
    followProfile.mockResolvedValue({
      status: "FOLLOWED",
      targetUserId: "target-1",
    });

    const response = await serverFactory()
      .post("/api/follow/target-user/follow")
      .send({});

    expect(followProfile).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      viewerName: "Viewer",
      targetUserId: "target-1",
      targetUsername: "target",
      targetName: "Target",
      requiresApproval: false,
    });
    expect(adjustRelationshipSnapshot).toHaveBeenCalledWith({
      actorId: "viewer-1",
      targetUserId: "target-1",
      isFollowing: true,
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "FOLLOWED", targetUserId: "target-1" },
      message: followMessages.FEEDBACK.followSuccess,
    });
  });

  it("skips snapshot and returns request message when status is REQUESTED", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-follow-request",
      log,
      viewerId: "viewer-1",
      viewerName: "Viewer",
      viewerUsername: "viewer",
      target: {
        id: "target-1",
        username: "target",
        name: "Target",
        isPrivate: true,
      },
    };
    prepareFollowAction.mockResolvedValue({ ok: true, context });
    followProfile.mockResolvedValue({
      status: "REQUESTED",
      requestId: "follow-request-1",
    });

    const response = await serverFactory()
      .post("/api/follow/target-user/follow")
      .send({});

    expect(adjustRelationshipSnapshot).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "REQUESTED", requestId: "follow-request-1" },
      message: "Follow request sent",
    });
  });

  it("returns normalized error when followProfile fails", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-error",
      log,
      viewerId: "viewer-1",
      viewerName: "Viewer",
      viewerUsername: "viewer",
      target: {
        id: "target-1",
        username: "target",
        name: "Target",
        isPrivate: false,
      },
    };
    const serviceError = new Error("Service failure");
    prepareFollowAction.mockResolvedValue({ ok: true, context });
    followProfile.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({
      status: 422,
      message: "follow-failed",
    });

    const response = await serverFactory()
      .post("/api/follow/target-user/follow")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 422 },
      "Follow request failed"
    );
    expect(adjustRelationshipSnapshot).not.toHaveBeenCalled();
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "follow-failed",
    });
  });
});
