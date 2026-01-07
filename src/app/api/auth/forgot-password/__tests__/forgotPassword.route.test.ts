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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/mail", () => ({
  sendMail: jest.fn(),
}));

jest.mock("crypto", () => {
  const actual = jest.requireActual<typeof import("crypto")>("crypto");
  return {
    ...actual,
    randomBytes: jest.fn(),
  };
});

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { prisma } = jest.requireMock("@/lib/prisma") as {
  prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
};

const { sendMail } = jest.requireMock("@/lib/mail") as { sendMail: jest.Mock };

const { randomBytes } = jest.requireMock("crypto") as {
  randomBytes: jest.Mock;
};

describe("/api/auth/forgot-password POST", () => {
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
    randomBytes.mockReturnValue({ toString: () => "reset-token-123" });
  });

  it("returns 400 when email missing", async () => {
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/forgot-password").send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authMessages.signup.fieldsRequired);
  });

  it("returns 200 even when email not found (prevents enumeration)", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/forgot-password")
      .send({ email: "unknown@example.com" });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(authMessages.password.forgotSent);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("generates token, updates user, and sends email when email exists", async () => {
    const fakeUser = {
      id: "user-1",
      email: "john@example.com",
      name: "John Doe",
    };
    prisma.user.findUnique.mockResolvedValue(fakeUser);
    prisma.user.update.mockResolvedValue({});
    sendMail.mockResolvedValue({});
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/forgot-password")
      .send({ email: fakeUser.email });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(authMessages.password.forgotSent);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: fakeUser.id },
      data: expect.objectContaining({
        resetToken: "reset-token-123",
        resetTokenExpiry: expect.any(Date),
      }),
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: fakeUser.email,
        subject: authMessages.password.resetEmailSubject,
        html: expect.stringContaining("reset-password?token=reset-token-123"),
      })
    );
  });

  it("does not reveal error when email send fails; still returns 200", async () => {
    const fakeUser = {
      id: "user-1",
      email: "john@example.com",
      name: "John Doe",
    };
    prisma.user.findUnique.mockResolvedValue(fakeUser);
    prisma.user.update.mockResolvedValue({});
    sendMail.mockRejectedValue(new Error("Mail fail"));
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/forgot-password")
      .send({ email: fakeUser.email });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(authMessages.password.forgotSent);
    expect(sendMail).toHaveBeenCalled();
  });

  it("returns 500 on unexpected errors", async () => {
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/forgot-password")
      .send({ email: "john@example.com" });
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
