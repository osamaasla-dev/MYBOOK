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

  return {
    params: Promise.resolve({ username }),
  };
};

const DELETE_WRAPPER = (req: Request) => DELETE(req, buildRouteContext(req));

jest.mock("../../shared", () => ({
  prepareFollowAction: jest.fn(),
}));

jest.mock("@/features/parts/follow/services/server", () => ({
  cancelFollowRequest: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareFollowAction } = jest.requireMock("../../shared") as {
  prepareFollowAction: jest.Mock;
};

const { cancelFollowRequest } = jest.requireMock(
  "@/features/parts/follow/services/server"
) as {
  cancelFollowRequest: jest.Mock;
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

describe("/api/follow/[username]/cancel-request DELETE", () => {
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
      .delete("/api/follow/target-user/cancel-request")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(cancelFollowRequest).not.toHaveBeenCalled();
  });

  it("cancels follow request when preparation succeeds", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-123",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: {
        id: "target-1",
        username: "target",
      },
    };

    prepareFollowAction.mockResolvedValue({ ok: true, context });
    cancelFollowRequest.mockResolvedValue({
      status: "CANCELLED",
      requestId: "follow-request-1",
    });

    const response = await serverFactory()
      .delete("/api/follow/target-user/cancel-request")
      .send({});

    expect(cancelFollowRequest).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      targetUserId: "target-1",
      targetUsername: "target",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "CANCELLED", requestId: "follow-request-1" },
      message: followMessages.FEEDBACK.cancelRequestSuccess,
    });
  });

  it("returns normalized error when cancelFollowRequest fails", async () => {
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
    cancelFollowRequest.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({
      status: 422,
      message: "cannot-cancel",
    });

    const response = await serverFactory()
      .delete("/api/follow/target-user/cancel-request")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 422 },
      "Cancel follow request failed"
    );
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-cancel",
    });
  });
});
