import { apiResponse } from "@/lib/apiResponse";
import { prepareFriendAction } from "../shared";
import { friendMessages, userMessages } from "@/lib/messages";

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

const ROUTE = "/api/add-friend/[username]/shared-tests";

const mockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => mockLog(),
});

const buildRequest = () => new Request("http://localhost/api/add-friend/test");

const buildParams = (username: string) => Promise.resolve({ username });

const viewer = { id: "viewer-1", name: "Viewer", username: "viewer_user" };
const targetProfile = {
  id: "target-1",
  name: "Target User",
  username: "target_user",
} as const;

type PrepareFriendResult = Awaited<ReturnType<typeof prepareFriendAction>>;

function expectFailure(result: PrepareFriendResult) {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error("Expected failure but got success");
  }
  return result.response;
}

function expectSuccess(result: PrepareFriendResult) {
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

describe("prepareFriendAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-123",
      log: mockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    checkRateLimit.mockResolvedValue({ ok: true });
    fetchProfileUserByUsername.mockResolvedValue(targetProfile);
    isBlock.mockResolvedValue({ anyBlock: false });
  });

  it("returns session response when session validation fails", async () => {
    const sessionResponse = apiResponse(
      false,
      {},
      "Session invalid",
      401,
      "req-session"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: sessionResponse,
    });

    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("target"),
      ROUTE
    );

    const response = expectFailure(result);
    expect(response).toBe(sessionResponse);
  });

  it("bubbles up rate limit responses when user exceeded limits", async () => {
    const rateLimitedResponse = new Response(
      JSON.stringify({ success: false, message: "Rate limited" }),
      { status: 429 }
    );
    checkRateLimit.mockResolvedValueOnce({
      ok: false,
      response: rateLimitedResponse,
    });

    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("target"),
      ROUTE
    );

    const response = expectFailure(result);
    expect(response).toBe(rateLimitedResponse);
  });

  it("returns 500 when viewer username missing", async () => {
    validateSession.mockResolvedValueOnce({
      ok: true,
      user: { ...viewer, username: undefined },
    });

    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("target"),
      ROUTE
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(500);
    expect(parsed.body.message).toBe(userMessages.failed);
  });

  it("rejects invalid usernames", async () => {
    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("invalid username"),
      ROUTE
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(400);
    expect(parsed.body.message).toBe(userMessages.invalidParams);
  });

  it("returns 404 when target profile missing", async () => {
    fetchProfileUserByUsername.mockResolvedValueOnce(null);

    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("target-user"),
      ROUTE
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(404);
    expect(parsed.body.message).toBe(userMessages.notFound);
  });

  it("prevents viewer from friending self", async () => {
    fetchProfileUserByUsername.mockResolvedValueOnce({
      ...targetProfile,
      id: viewer.id,
    });

    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("viewer_user"),
      ROUTE
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(400);
    expect(parsed.body.message).toBe(friendMessages.FRIEND_ERRORS.selfFriend);
  });

  it("hides target when any block exists", async () => {
    isBlock.mockResolvedValueOnce({ anyBlock: true });

    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("target-user"),
      ROUTE
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(404);
    expect(parsed.body.message).toBe(userMessages.notFound);
  });

  it("returns success context when all checks pass", async () => {
    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("target-user"),
      ROUTE
    );

    const context = expectSuccess(result);
    expect(context).toMatchObject({
      viewerId: viewer.id,
      viewerName: viewer.name,
      viewerUsername: viewer.username,
      target: targetProfile,
    });
  });

  it("returns 500 when unexpected error occurs", async () => {
    const failure = new Error("unexpected");
    fetchProfileUserByUsername.mockRejectedValueOnce(failure);

    const result = await prepareFriendAction(
      buildRequest(),
      buildParams("target-user"),
      ROUTE
    );

    const parsed = await parseResponse(expectFailure(result));
    expect(parsed.status).toBe(500);
    expect(parsed.body.message).toBe(userMessages.failed);
  });
});
