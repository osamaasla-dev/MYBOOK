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
  },
  {
    username: "user2",
    firstName: "User",
    lastName: "Two",
    email: "user2@example.com",
    phone: "+10000000002",
    gender: "FEMALE" as Gender,
    birthDate: new Date("1997-02-02"),
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
      },
    });
  }

  console.log(
    `Seeded ${seedUsers.length} users. Default password for all is "${DEFAULT_PASSWORD}".`
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
