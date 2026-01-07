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

  return {
    params: Promise.resolve({ username }),
  };
};

const POST_WRAPPER = (req: Request) => POST(req, buildRouteContext(req));

jest.mock("../../shared", () => ({
  prepareFollowAction: jest.fn(),
}));

jest.mock("@/features/parts/follow/services/server", () => ({
  acceptFollowRequest: jest.fn(),
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

const { acceptFollowRequest } = jest.requireMock(
  "@/features/parts/follow/services/server"
) as {
  acceptFollowRequest: jest.Mock;
};

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

describe("/api/follow/[username]/accept-request POST", () => {
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
      .post("/api/follow/target-user/accept-request")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(acceptFollowRequest).not.toHaveBeenCalled();
    expect(adjustRelationshipSnapshot).not.toHaveBeenCalled();
  });

  it("accepts follow request and updates relationship snapshot", async () => {
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

    prepareFollowAction.mockResolvedValue({ ok: true, context });
    acceptFollowRequest.mockResolvedValue({
      status: "ACCEPTED",
      requestId: "follow-request-1",
    });

    const response = await serverFactory()
      .post("/api/follow/target-user/accept-request")
      .send({});

    expect(acceptFollowRequest).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      viewerName: "Viewer",
      requesterId: "target-1",
      requesterUsername: "target",
      requesterName: "Target",
    });

    expect(adjustRelationshipSnapshot).toHaveBeenCalledWith({
      actorId: "target-1",
      targetUserId: "viewer-1",
      isFollowing: true,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "ACCEPTED", requestId: "follow-request-1" },
      message: followMessages.FEEDBACK.acceptRequestSuccess,
    });
  });

  it("returns normalized error when acceptFollowRequest fails", async () => {
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
    prepareFollowAction.mockResolvedValue({ ok: true, context });
    acceptFollowRequest.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({
      status: 422,
      message: "cannot-accept",
    });

    const response = await serverFactory()
      .post("/api/follow/target-user/accept-request")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 422 },
      "Accept follow request failed"
    );
    expect(adjustRelationshipSnapshot).not.toHaveBeenCalled();
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-accept",
    });
  });
});
