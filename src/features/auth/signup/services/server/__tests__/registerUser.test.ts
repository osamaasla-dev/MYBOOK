import { registerUser, type RegisterUserArgs } from "../registerUser";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const { prisma: mockPrisma } = jest.requireMock("@/lib/prisma") as {
  prisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
};

const { hash } = jest.requireMock("bcryptjs") as { hash: jest.Mock };

describe("registerUser", () => {
  const args: RegisterUserArgs = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    password: "Password1!",
    gender: "MALE",
    birthDate: new Date("2000-01-01"),
    verificationToken: "abc123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (hash as jest.Mock).mockResolvedValue("hashedPassword");
  });

  it("returns error if email already exists", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "1", email: args.email });
    const result = await registerUser(args);
    expect(result).toHaveProperty("error");
    expect(result.error?.message).toBe("Email already registered");
    expect(result.error?.status).toBe(409);
  });

  it("returns error if phone already exists", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: "1", phone: args.phone });
    const result = await registerUser(args);
    expect(result).toHaveProperty("error");
    expect(result.error?.message).toBe("Phone already registered");
    expect(result.error?.status).toBe(409);
  });

  it("creates user with unique username and hashed password", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const created = {
      id: "1",
      username: "johndoe",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: args.email,
      phone: args.phone,
      gender: "MALE",
      birthDate: args.birthDate,
      isVerified: false,
      createdAt: new Date(),
    };
    mockPrisma.user.create.mockResolvedValue(created);

    const result = await registerUser(args);
    expect(hash).toHaveBeenCalledWith(args.password, 10);
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: expect.stringMatching(/^johndoe/),
          name: "John Doe",
          email: args.email,
          phone: args.phone,
          password: "hashedPassword",
          gender: "MALE",
          birthDate: args.birthDate,
          verificationToken: args.verificationToken,
          verificationTokenExpiry: expect.any(Date),
        }),
        select: expect.any(Object),
      })
    );
    expect(result).toEqual({ user: created });
  });

  it("appends suffix if username collides", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    // Simulate collision twice, then succeed
    mockPrisma.user.findUnique
      .mockResolvedValueOnce({ id: "1" }) // johndoe taken
      .mockResolvedValueOnce({ id: "2" }) // johndoe1234 taken
      .mockResolvedValueOnce(null); // johndoe5678 free
    const created = {
      id: "3",
      username: "johndoe5678",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: args.email,
      phone: args.phone,
      gender: "MALE",
      birthDate: args.birthDate,
      isVerified: false,
      createdAt: new Date(),
    };
    mockPrisma.user.create.mockResolvedValue(created);

    const result = await registerUser(args);
    expect(result.user?.username).toMatch(/^johndoe\d{4}$/);
  });

  it("falls back to timestamp suffix after max attempts", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    // Simulate 10 collisions to trigger fallback
    for (let i = 0; i < 10; i++) {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: `${i}` });
    }
    const created = {
      id: "fallback",
      username: "johndoe123456", // timestamp fallback
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: args.email,
      phone: args.phone,
      gender: "MALE",
      birthDate: args.birthDate,
      isVerified: false,
      createdAt: new Date(),
    };
    mockPrisma.user.create.mockResolvedValue(created);

    const result = await registerUser(args);
    expect(result.user?.username).toMatch(/^johndoe\d{6}$/);
  });

  it("slugifies non‑ASCII names and falls back to user", async () => {
    const specialArgs = { ...args, firstName: "Álvaro", lastName: "Émilie" };
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const created = {
      id: "1",
      username: "alvaroemilie",
      name: "Álvaro Émilie",
      firstName: "Álvaro",
      lastName: "Émilie",
      email: specialArgs.email,
      phone: specialArgs.phone,
      gender: "MALE",
      birthDate: specialArgs.birthDate,
      isVerified: false,
      createdAt: new Date(),
    };
    mockPrisma.user.create.mockResolvedValue(created);

    const result = await registerUser(specialArgs);
    expect(result.user?.username).toBe("alvaroemilie");
  });

  it("sets verificationTokenExpiry to 24h from now", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const created = {
      id: "1",
      username: "johndoe",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      email: args.email,
      phone: args.phone,
      gender: "MALE",
      birthDate: args.birthDate,
      isVerified: false,
      createdAt: new Date(),
    };
    mockPrisma.user.create.mockResolvedValue(created);

    const before = Date.now();
    await registerUser(args);

    const createCall = mockPrisma.user.create.mock.calls[0];
    const expiry = createCall[0].data.verificationTokenExpiry;
    const diff = expiry.getTime() - before;
    const maxDiff = 24 * 60 * 60 * 1000 + 1000; // 24h + 1s tolerance
    expect(diff).toBeGreaterThan(24 * 60 * 60 * 1000 - 1000);
    expect(diff).toBeLessThan(maxDiff);
  });
});
