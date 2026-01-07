import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
import { apiResponse } from "@/lib/apiResponse";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/lib/pusher/server", () => ({
  pusherServer: {
    authorizeChannel: jest.fn(),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { pusherServer } = jest.requireMock("@/lib/pusher/server") as {
  pusherServer: { authorizeChannel: jest.Mock };
};

const { logger } = jest.requireMock("@/lib/logger") as {
  logger: { error: jest.Mock };
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const viewer = { id: "user-1" };

const callRoute = (body?: Record<string, unknown>) =>
  request(
    createTestServer((req: Request) => {
      return POST(req);
    })
  )
    .post("/api/pusher/auth")
    .set("content-type", "application/json")
    .send(
      body ?? {
        socket_id: "socket-1",
        channel_name: `private-user-${viewer.id}`,
      }
    );

describe("/api/pusher/auth POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-pusher-auth",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    pusherServer.authorizeChannel.mockReturnValue({ auth: "token" });
  });

  it("returns session response when auth fails", async () => {
    const sessionResponse = apiResponse(
      false,
      {},
      "unauthorized",
      401,
      "req-auth"
    );
    validateSession.mockResolvedValueOnce({
      ok: false,
      response: sessionResponse,
    });

    const response = await callRoute();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(pusherServer.authorizeChannel).not.toHaveBeenCalled();
  });

  it("returns 400 when socket or channel missing", async () => {
    const response = await callRoute({ socket_id: "socket-1" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Missing socket_id or channel_name",
    });
    expect(pusherServer.authorizeChannel).not.toHaveBeenCalled();
  });

  it("returns 403 when channel name invalid", async () => {
    const response = await callRoute({
      socket_id: "socket-1",
      channel_name: "presence-room",
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Invalid channel" });
    expect(pusherServer.authorizeChannel).not.toHaveBeenCalled();
  });

  it("returns 401 when channel owner mismatch", async () => {
    const response = await callRoute({
      socket_id: "socket-1",
      channel_name: "private-user-other",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
    expect(pusherServer.authorizeChannel).not.toHaveBeenCalled();
  });

  it("authorizes channel successfully", async () => {
    const response = await callRoute();

    expect(pusherServer.authorizeChannel).toHaveBeenCalledWith(
      "socket-1",
      `private-user-${viewer.id}`
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ auth: "token" });
  });

  it("handles unexpected errors", async () => {
    const unexpected = new Error("pusher down");
    pusherServer.authorizeChannel.mockImplementationOnce(() => {
      throw unexpected;
    });

    const response = await callRoute();

    expect(logger.error).toHaveBeenCalledWith(
      { error: unexpected },
      "Pusher auth failed"
    );
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Pusher auth failed" });
  });
});
