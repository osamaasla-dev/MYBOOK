import { PrismaClient, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "a123456789A@";

const seedUsers = [
  {
    username: "user1",
    firstName: "User",
    lastName: "One",
    email: "user1@example.com",
    phone: "+10000000001",
    gender: "MALE" as Gender,
    birthDate: new Date("1995-01-01"),
    isPrivate: false,
  },
  {
    username: "user2",
    firstName: "User",
    lastName: "Two",
    email: "user2@example.com",
    phone: "+10000000002",
    gender: "FEMALE" as Gender,
    birthDate: new Date("1997-02-02"),
    isPrivate: false,
  },
  {
    username: "user3",
    firstName: "User",
    lastName: "three",
    email: "user3@example.com",
    phone: "+10000000003",
    gender: "FEMALE" as Gender,
    birthDate: new Date("1997-02-02"),
    isPrivate: true,
  },
  {
    username: "user4",
    firstName: "User",
    lastName: "Four",
    email: "user4@example.com",
    phone: "+10000000004",
    gender: "MALE" as Gender,
    birthDate: new Date("1993-03-03"),
    isPrivate: true,
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: hashedPassword,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate,
        emailVerified: true,
        isPrivate: Boolean(user.isPrivate),
      },
    });
  }

  console.log(
    `Seeded ${seedUsers.length} users Default password for all is "${DEFAULT_PASSWORD}".`
  );
}

main()
  .catch((err) => {
    console.error("Seeding failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
