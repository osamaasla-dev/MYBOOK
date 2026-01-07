import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";
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

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
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

const { hash } = jest.requireMock("bcryptjs") as { hash: jest.Mock };

describe("/api/auth/reset-password POST", () => {
  const token = "reset-token";
  const basePayload = {
    token,
    password: "StrongPass1!",
    confirmPassword: "StrongPass1!",
  };

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
    hash.mockResolvedValue("hashed");
  });

  it("returns 400 when token missing", async () => {
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/reset-password").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.password.invalidToken);
  });

  it("returns 400 when password fields missing", async () => {
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/reset-password")
      .send({ token });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.signup.fieldsRequired);
  });

  it("returns 400 when password weak", async () => {
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/reset-password").send({
      token,
      password: "weak",
      confirmPassword: "weak",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.signup.invalidPassword);
  });

  it("returns 400 when password mismatch", async () => {
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/reset-password").send({
      token,
      password: "StrongPass1!",
      confirmPassword: "StrongPass2!",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.signup.passwordsMismatch);
  });

  it("returns 400 when token not found or expired", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/reset-password")
      .send(basePayload);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.any(Object) })
    );
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.password.invalidToken);
  });

  it("updates password and clears reset fields", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: "user-1" });
    prisma.user.update.mockResolvedValue({});
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/reset-password")
      .send(basePayload);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(authMessages.password.resetSuccess);
    expect(hash).toHaveBeenCalledWith("StrongPass1!", 10);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        password: "hashed",
        resetToken: null,
        resetTokenExpiry: null,
        failedAttempts: 0,
        lockedUntil: null,
      }),
    });
  });

  it("returns 500 when prisma update throws", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: "user-1" });
    prisma.user.update.mockRejectedValue(new Error("DB fail"));
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/reset-password")
      .send(basePayload);
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
