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
  rejectFollowRequest: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { prepareFollowAction } = jest.requireMock("../../shared") as {
  prepareFollowAction: jest.Mock;
};

const { rejectFollowRequest } = jest.requireMock(
  "@/features/parts/follow/services/server"
) as {
  rejectFollowRequest: jest.Mock;
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

describe("/api/follow/[username]/reject-request POST", () => {
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
      .post("/api/follow/target-user/reject-request")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "fail",
    });
    expect(rejectFollowRequest).not.toHaveBeenCalled();
  });

  it("rejects follow request when preparation succeeds", async () => {
    const log = createMockLog();
    const context = {
      requestId: "req-123",
      log,
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      target: { id: "target-1", username: "target" },
    };

    prepareFollowAction.mockResolvedValue({ ok: true, context });
    rejectFollowRequest.mockResolvedValue({ status: "REJECTED" });

    const response = await serverFactory()
      .post("/api/follow/target-user/reject-request")
      .send({});

    expect(rejectFollowRequest).toHaveBeenCalledWith({
      viewerId: "viewer-1",
      viewerUsername: "viewer",
      requesterId: "target-1",
      requesterUsername: "target",
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "REJECTED" },
      message: followMessages.FEEDBACK.rejectRequestSuccess,
    });
  });

  it("returns normalized error when rejectFollowRequest fails", async () => {
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
    rejectFollowRequest.mockRejectedValue(serviceError);
    normalizeError.mockReturnValue({
      status: 422,
      message: "cannot-reject",
    });

    const response = await serverFactory()
      .post("/api/follow/target-user/reject-request")
      .send({});

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 422 },
      "Reject follow request failed"
    );
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "cannot-reject",
    });
  });
});
