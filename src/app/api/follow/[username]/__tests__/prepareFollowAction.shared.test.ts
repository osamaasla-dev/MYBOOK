import { apiResponse } from "@/lib/apiResponse";
import { userMessages } from "@/lib/messages";
import { prepareFollowAction } from "../shared";
import type { ProfileUserRecord } from "@/features/pages/profile/types";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/parts/ratelimit/services", () => ({
  checkRateLimit: jest.fn(),
}));

jest.mock("@/features/pages/profile/utils", () => ({
  fetchProfileUserByUsername: jest.fn(),
}));

jest.mock("@/features/parts/block/utils/server", () => ({
  isBlock: jest.fn(),
}));

jest.mock("@/features/parts/follow/utils", () => ({
  normalizeFollowUsername: jest.fn(),
  validateFollowTarget: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { checkRateLimit } = jest.requireMock(
  "@/features/parts/ratelimit/services"
) as {
  checkRateLimit: jest.Mock;
};

const { fetchProfileUserByUsername } = jest.requireMock(
  "@/features/pages/profile/utils"
) as {
  fetchProfileUserByUsername: jest.Mock;
};

const { isBlock } = jest.requireMock("@/features/parts/block/utils/server") as {
  isBlock: jest.Mock;
};

const { normalizeFollowUsername, validateFollowTarget } = jest.requireMock(
  "@/features/parts/follow/utils"
) as {
  normalizeFollowUsername: jest.Mock;
  validateFollowTarget: jest.Mock;
};

const ROUTE = "/api/follow/[username]/shared-tests";

const mockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => mockLog(),
});

const buildRequest = () => new Request("http://localhost/api/follow/test");
const buildParams = (username?: string) => Promise.resolve({ username });

const viewer = { id: "viewer-1", name: "Viewer", username: "viewer_user" };

const targetProfile: ProfileUserRecord = {
  id: "target-1",
  name: "Target User",
  username: "target_user",
  avatarUrl: null,
  avatarPublicId: null,
  bio: null,
  websiteUrl: null,
  coverUrl: null,
  coverPublicId: null,
  isPrivate: true,
  isVerified: false,
  followersCount: 10,
  followingCount: 5,
  friendsCount: 2,
  postsCount: 3,
  createdAt: new Date("2024-01-01T00:00:00Z"),
};

type PrepareFollowResult = Awaited<ReturnType<typeof prepareFollowAction>>;

function expectFailure(result: PrepareFollowResult) {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("Expected failure but got success");
  }
  return result.response;
}

function expectSuccess(result: PrepareFollowResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error("Expected success but got failure");
  }
  return result.context;
}

async function parseResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
  };
}

describe("prepareFollowAction", () => {
  let currentLog: ReturnType<typeof mockLog>;
  beforeEach(() => {
    jest.clearAllMocks();
    currentLog = mockLog();
    getRequestLog.mockResolvedValue({
      requestId: "req-123",
      log: currentLog,
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    normalizeFollowUsername.mockImplementation((username?: string) =>
      username ? username.toLowerCase() : null
    );
    fetchProfileUserByUsername.mockResolvedValue(targetProfile);
    validateFollowTarget.mockReturnValue({
      ok: true,
      profile: targetProfile,
      requiresApproval: targetProfile.isPrivate,
    });
    isBlock.mockResolvedValue({ anyBlock: false });
  });

  it("returns session response when validation fails", async () => {
    const sessionResponse = apiResponse(
      false,
      {},
      "unauthorized",
      401,
      "req-session"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: sessionResponse,
    });

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("target"),
      { route: ROUTE, action: "follow" }
    );

    const response = expectFailure(result);
    expect(response).toBe(sessionResponse);
  });

  it("bubbles up rate limit response", async () => {
    const rateLimitedResponse = new Response(
      JSON.stringify({ success: false, message: "Rate limited" }),
      { status: 429 }
    );
    checkRateLimit.mockResolvedValueOnce({
      ok: false,
      response: rateLimitedResponse,
    });

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("target"),
      { route: ROUTE, action: "follow" }
    );

    const response = expectFailure(result);
    expect(response).toBe(rateLimitedResponse);
  });

  it("returns 500 when viewer username missing", async () => {
    validateSession.mockResolvedValueOnce({
      ok: true,
      user: { ...viewer, username: undefined },
    });

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("target"),
      { route: ROUTE, action: "follow" }
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(500);
    expect(parsed.body.message).toBe(userMessages.failed);
  });

  it("rejects invalid normalized usernames", async () => {
    normalizeFollowUsername.mockReturnValueOnce(null);

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("bad username"),
      { route: ROUTE, action: "follow" }
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(400);
    expect(parsed.body.message).toBe(userMessages.invalidParams);
    expect(fetchProfileUserByUsername).not.toHaveBeenCalled();
  });

  it("returns 404 when target profile missing", async () => {
    fetchProfileUserByUsername.mockResolvedValueOnce(null);
    validateFollowTarget.mockReturnValueOnce({
      ok: false,
      reason: "NOT_FOUND",
    });

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("target_user"),
      { route: ROUTE, action: "follow" }
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(404);
    expect(parsed.body.message).toBe(userMessages.notFound);
  });

  it("prevents viewer from following self", async () => {
    validateFollowTarget.mockReturnValueOnce({
      ok: false,
      reason: "SELF",
    });

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("viewer_user"),
      { route: ROUTE, action: "follow" }
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(400);
    expect(parsed.body.message).toBe("FOLLOW_SELF_NOT_ALLOWED");
  });

  it("hides target when any block exists", async () => {
    isBlock.mockResolvedValueOnce({ anyBlock: true });

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("target_user"),
      { route: ROUTE, action: "follow" }
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(404);
    expect(parsed.body.message).toBe(userMessages.notFound);
  });

  it("logs descriptive label per action", async () => {
    await prepareFollowAction(buildRequest(), buildParams("target"), {
      route: ROUTE,
      action: "remove-follower",
    });

    expect(currentLog.info).toHaveBeenCalledWith(
      "Remove follower request started"
    );
  });

  it("returns success context when all checks pass", async () => {
    validateFollowTarget.mockReturnValueOnce({
      ok: true,
      profile: targetProfile,
      requiresApproval: true,
    });

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("target_user"),
      { route: ROUTE, action: "follow" }
    );

    const context = expectSuccess(result);
    expect(context).toMatchObject({
      requestId: "req-123",
      viewerId: viewer.id,
      viewerName: viewer.name,
      viewerUsername: viewer.username,
      target: targetProfile,
      requiresApproval: true,
    });
  });

  it("returns 500 when unexpected error occurs", async () => {
    const failure = new Error("unexpected");
    fetchProfileUserByUsername.mockRejectedValueOnce(failure);

    const result = await prepareFollowAction(
      buildRequest(),
      buildParams("target_user"),
      { route: ROUTE, action: "follow" }
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(500);
    expect(parsed.body.message).toBe(userMessages.failed);
  });
});
