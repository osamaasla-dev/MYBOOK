import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import { apiResponse } from "@/lib/apiResponse";
import { relationsMessages } from "@/lib/messages";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/features/services/server", () => ({
  validateSession: jest.fn(),
}));

jest.mock("@/features/pages/relations/schema", () => ({
  parseRelationsQuery: jest.fn(),
}));

jest.mock("@/features/pages/relations/services/fetchRelations", () => ({
  fetchRelationsList: jest.fn(),
}));

jest.mock("@/lib/http/normalizeError", () => ({
  normalizeError: jest.fn(),
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { validateSession } = jest.requireMock("@/features/services/server") as {
  validateSession: jest.Mock;
};

const { parseRelationsQuery } = jest.requireMock(
  "@/features/pages/relations/schema"
) as { parseRelationsQuery: jest.Mock };

const { fetchRelationsList } = jest.requireMock(
  "@/features/pages/relations/services/fetchRelations"
) as { fetchRelationsList: jest.Mock };

const { normalizeError } = jest.requireMock("@/lib/http/normalizeError") as {
  normalizeError: jest.Mock;
};

const createMockLog = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: () => createMockLog(),
});

const viewer = { id: "viewer-1", name: "Viewer", username: "viewer" };

const serverFactory = () =>
  request(createTestServer((req: Request) => GET(req)));

describe("/api/me/relations GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-relations",
      log: createMockLog(),
    });
    validateSession.mockResolvedValue({ ok: true, user: viewer });
    parseRelationsQuery.mockReturnValue({
      ok: true,
      value: { tab: "followers", limit: 20, cursor: null },
    });
    fetchRelationsList.mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    normalizeError.mockReturnValue({ status: 500, message: "boom" });
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

    const response = await serverFactory().get("/api/me/relations").send();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "unauthorized",
    });
    expect(parseRelationsQuery).not.toHaveBeenCalled();
  });

  it("returns 400 when relations query invalid", async () => {
    parseRelationsQuery.mockReturnValueOnce({
      ok: false,
      message: "bad-tab",
    });

    const response = await serverFactory().get("/api/me/relations").send();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: relationsMessages.invalidParams,
    });
    expect(fetchRelationsList).not.toHaveBeenCalled();
  });

  it("fetches relations list successfully", async () => {
    fetchRelationsList.mockResolvedValueOnce({
      items: [{ id: "rel-1" }],
      nextCursor: "cursor-2",
    });

    const response = await serverFactory().get("/api/me/relations").send();

    expect(fetchRelationsList).toHaveBeenCalledWith({
      userId: "viewer-1",
      tab: "followers",
      limit: 20,
      cursor: null,
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        items: [{ id: "rel-1" }],
        nextCursor: "cursor-2",
      },
      message: relationsMessages.fetchSuccess,
    });
  });

  it("returns normalized error when fetch fails", async () => {
    const log = createMockLog();
    getRequestLog.mockResolvedValueOnce({ requestId: "req-error", log });
    const serviceError = new Error("db down");
    fetchRelationsList.mockRejectedValueOnce(serviceError);
    normalizeError.mockReturnValueOnce({
      status: 503,
      message: "service-down",
    });

    const response = await serverFactory().get("/api/me/relations").send();

    expect(normalizeError).toHaveBeenCalledWith(serviceError);
    expect(log.error).toHaveBeenCalledWith(
      { err: serviceError, status: 503 },
      relationsMessages.fetchFailed
    );
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      data: {},
      message: "service-down",
    });
  });
});
