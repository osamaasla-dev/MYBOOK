import request from "supertest";
import { createTestServer } from "tests/testServer";
import { GET } from "../route";
import authMessages from "@/lib/messages/auth";

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { prisma } = jest.requireMock("@/lib/prisma") as {
  prisma: {
    user: {
      findFirst: jest.Mock;
    };
  };
};

describe("/api/auth/reset-password/validate GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-1",
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
      },
    });
  });

  it("returns 400 when token missing", async () => {
    const server = request(createTestServer(GET));
    const response = await server.get("/api/auth/reset-password/validate");
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.password.invalidToken);
    expect(response.body.data.valid).toBe(false);
  });

  it("returns 400 when token not found or expired", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const server = request(createTestServer(GET));
    const response = await server.get(
      "/api/auth/reset-password/validate?token=bad"
    );
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ resetToken: "bad" }),
      })
    );
    expect(response.status).toBe(400);
    expect(response.body.data.valid).toBe(false);
    expect(response.body.message).toBe(authMessages.password.invalidToken);
  });

  it("returns 200 when token valid", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      password: "hashed",
    });
    const server = request(createTestServer(GET));
    const response = await server.get(
      "/api/auth/reset-password/validate?token=valid-token"
    );
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.valid).toBe(true);
    expect(response.body.message).toBe("OK");
  });

  it("returns 500 on unexpected errors", async () => {
    prisma.user.findFirst.mockRejectedValue(new Error("DB error"));
    const server = request(createTestServer(GET));
    const response = await server.get(
      "/api/auth/reset-password/validate?token=any"
    );
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.data.valid).toBe(false);
  });
});
