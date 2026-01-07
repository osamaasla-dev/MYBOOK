import request from "supertest";
import { createTestServer } from "tests/testServer";
import { POST } from "../route";

jest.mock("@/features/auth/signup/services/server", () => ({
  registerUser: jest.fn(),
}));

jest.mock("@/lib/mail", () => ({
  sendMail: jest.fn(),
}));

jest.mock("@/lib/request-log", () => ({
  getRequestLog: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      delete: jest.fn(),
    },
  },
}));

jest.mock("crypto", () => {
  const actual = jest.requireActual<typeof import("crypto")>("crypto");
  return {
    ...actual,
    randomBytes: jest.fn(),
  };
});

const { registerUser } = jest.requireMock(
  "@/features/auth/signup/services/server"
) as { registerUser: jest.Mock };

const { sendMail } = jest.requireMock("@/lib/mail") as { sendMail: jest.Mock };

const { getRequestLog } = jest.requireMock("@/lib/request-log") as {
  getRequestLog: jest.Mock;
};

const { prisma } = jest.requireMock("@/lib/prisma") as {
  prisma: {
    user: {
      delete: jest.Mock;
    };
  };
};

const { randomBytes } = jest.requireMock("crypto") as {
  randomBytes: jest.Mock;
};

describe("/api/auth/signup POST", () => {
  const payload = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    gender: "MALE",
    birthDate: "2000-01-01",
    password: "Password1!",
    confirmPassword: "Password1!",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getRequestLog.mockResolvedValue({
      requestId: "req-1",
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: () => ({
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        }),
      },
    });
    randomBytes.mockReturnValue({ toString: () => "token123" });
  });

  it("returns 400 on invalid schema", async () => {
    const server = request(createTestServer(POST));
    const response = await server
      .post("/api/auth/signup")
      .send({ email: "bad" });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("returns 409 if registerUser reports email/phone conflict", async () => {
    registerUser.mockResolvedValue({
      error: { status: 409, message: "Email already registered" },
    });
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/signup").send(payload);
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email already registered");
  });

  it("creates user, sends email, and returns 201", async () => {
    const fakeUser = {
      id: "1",
      username: "johndoe",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: payload.email,
      phone: payload.phone,
      gender: "MALE",
      birthDate: new Date("2000-01-01"),
      isVerified: false,
      createdAt: new Date(),
    };
    registerUser.mockResolvedValue({ user: fakeUser });
    sendMail.mockResolvedValue({});
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/signup").send(payload);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toEqual({
      ...fakeUser,
      birthDate: fakeUser.birthDate.toISOString(),
      createdAt: fakeUser.createdAt.toISOString(),
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: payload.email,
        subject: "Please verify your email",
        html: expect.stringContaining("verify-email?token=token123"),
      })
    );
  });

  it("rolls back user and returns 500 if email send fails", async () => {
    const fakeUser = {
      id: "1",
      username: "johndoe",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: payload.email,
      phone: payload.phone,
      gender: "MALE",
      birthDate: new Date("2000-01-01"),
      isVerified: false,
      createdAt: new Date(),
    };
    registerUser.mockResolvedValue({ user: fakeUser });
    sendMail.mockRejectedValue(new Error("Mail fail"));
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/signup").send(payload);
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/verification email/i);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: fakeUser.id },
    });
  });

  it("handles unexpected errors and returns 500", async () => {
    registerUser.mockRejectedValue(new Error("DB error"));
    const server = request(createTestServer(POST));
    const response = await server.post("/api/auth/signup").send(payload);
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
