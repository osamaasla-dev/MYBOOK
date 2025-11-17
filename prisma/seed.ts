// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";
// const prisma = new PrismaClient();

// async function main() {
//   // Global Setting (singleton)
//   await prisma.setting.upsert({
//     where: { id: "default" },
//     update: {
//       // Keep existing values on update; you can override here if desired
//     },
//     create: {
//       // id defaults to "default" via schema default, but set explicitly for clarity
//       id: "default",
//       siteName: "MYBOOK",
//       senderEmail: "elshabbah95@gmail.com",
//     },
//   });
//   // Admin user
//   const adminEmail = "admin@admin.com";
//   const adminPasswordPlain = "a123456789A@";
//   const adminPassword = await bcrypt.hash(adminPasswordPlain, 10);
//   await prisma.user.create({
//     data: {
//       name: "Admin",
//       email: adminEmail,
//       password: adminPassword,

//       emailVerified: true,
//     },
//   });
//   //  user
//   const userEmail = "user@user.com";
//   const userPasswordPlain = "a123456789A@";
//   const userPassword = await bcrypt.hash(userPasswordPlain, 10);
//   await prisma.user.create({
//     data: {
//       name: "user",
//       email: userEmail,
//       password: userPassword,
//       emailVerified: true,
//     },
//   });
// }
// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
