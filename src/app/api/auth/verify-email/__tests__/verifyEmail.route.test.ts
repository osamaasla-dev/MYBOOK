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
      update: jest.fn(),
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
      update: jest.Mock;
    };
  };
};

describe("/api/auth/verify-email GET", () => {
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
    const response = await server.get("/api/auth/verify-email");
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.verify.result.missingToken);
  });

  it("returns 404 when token not found", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const server = request(createTestServer(GET));
    const response = await server.get("/api/auth/verify-email?token=badtoken");
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { verificationToken: "badtoken" } })
    );
    expect(response.status).toBe(404);
    expect(response.body.message).toBe(authMessages.verify.result.failed);
  });

  it("verifies email and clears token when token valid", async () => {
    const fakeUser = { id: "user-1" };
    prisma.user.findFirst.mockResolvedValue(fakeUser);
    prisma.user.update.mockResolvedValue({});
    const server = request(createTestServer(GET));
    const response = await server.get(
      "/api/auth/verify-email?token=valid-token"
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: fakeUser.id },
      data: { emailVerified: true, verificationToken: null },
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(authMessages.verify.result.success);
  });

  it("returns 500 on unexpected errors", async () => {
    prisma.user.findFirst.mockRejectedValue(new Error("DB error"));
    const server = request(createTestServer(GET));
    const response = await server.get("/api/auth/verify-email?token=any");
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
