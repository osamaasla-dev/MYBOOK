import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        // Lockout check
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const diffMs = user.lockedUntil.getTime() - Date.now();
          const minutes = Math.ceil(diffMs / 60000);
          throw new Error(`ACCOUNT_LOCKED:${minutes}`);
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          const attempts = (user.failedAttempts || 0) + 1;
          let lockedUntil: Date | null = null;
          if (attempts >= 5) {
            lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts: attempts >= 5 ? 0 : attempts,
              lockedUntil: lockedUntil,
            },
          });
          return null;
        }

        // Block sign-in until email is verified
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // Reset lockout counters on success
        if (user.failedAttempts || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn() {
      return true;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id as string;
        token.username = user.username;
        // Prefer role from user when present (credentials flow), otherwise fetch from DB (OAuth flow)
        const maybeRole = (user as Partial<typeof user> & { role?: string })
          .role;
        if (maybeRole) {
          token.role = maybeRole;
        } else if (token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
          });
          if (dbUser) token.role = dbUser.role;
        }
      }
      return token;
    },
  },

  pages: {
    signIn: "/signin",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
