import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

export type RegisterUserArgs = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  gender: "MALE" | "FEMALE";
  birthDate: Date;
  verificationToken: string;
};

function slugify(input: string) {
  const normalized = input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  return compact || "user";
}

async function generateUniqueUsername(base: string): Promise<string> {
  const MAX_ATTEMPTS = 10;
  const root = slugify(base);

  // Try plain root first
  let candidate = root;
  let attempt = 0;
  while (attempt < MAX_ATTEMPTS) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
    });
    if (!existing) return candidate;
    // Append random 4 digits
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    candidate = `${root}${suffix}`;
    attempt++;
  }
  // Fallback to cuid segment if collisions persist
  return `${root}${Date.now().toString().slice(-6)}`;
}

export async function registerUser(args: RegisterUserArgs) {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    gender,
    birthDate,
    verificationToken,
  } = args;

  // Check existing by email/phone
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { id: true, email: true, phone: true },
  });
  if (existing) {
    const isEmail = existing.email === email;
    const isPhone = existing.phone === phone;
    return {
      error: {
        status: 409,
        message: isEmail
          ? "Email already registered"
          : isPhone
          ? "Phone already registered"
          : "User already exists",
      },
    } as const;
  }

  const username = await generateUniqueUsername(`${firstName}${lastName}`);
  const hashed = await bcrypt.hash(password, 10);
  const fullName = `${firstName} ${lastName}`.trim();

  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: {
      username,
      name: fullName,
      firstName,
      lastName,
      email,
      phone,
      password: hashed,
      gender: gender as Gender,
      birthDate,
      verificationToken,
      verificationTokenExpiry,
      // Defaults handled by schema: emailVerified false, role USER, counters 0
    },
    select: {
      id: true,
      username: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      gender: true,
      birthDate: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return { user } as const;
}
