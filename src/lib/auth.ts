import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

type Role = "ADMIN" | "CANTINA" | "COLLECTOR";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;
        if (user.isBlocked) return null;

        // Check lockout
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await logActivity(user.id, "LOGIN_FAILED", "Account bloccato temporaneamente");
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password);

        if (!valid) {
          const newFailCount = (user.failedLoginAttempts || 0) + 1;
          const shouldLock = newFailCount >= MAX_FAILED_ATTEMPTS;
          const lockedUntil = shouldLock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : undefined;

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailCount,
              ...(shouldLock ? { lockedUntil } : {}),
            },
          });

          if (shouldLock) {
            await logActivity(user.id, "ACCOUNT_LOCKED", `Bloccato dopo ${newFailCount} tentativi falliti`);
          } else {
            await logActivity(user.id, "LOGIN_FAILED", `Tentativo ${newFailCount}/${MAX_FAILED_ATTEMPTS}`);
          }
          return null;
        }

        // Reset failed attempts on successful login
        await db.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });

        await logActivity(user.id, "LOGIN");

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { password: true } });
      if (dbUser && !dbUser.password) {
        await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await db.user.findUnique({ where: { id: user.id! }, select: { role: true } });
        token.role = dbUser?.role ?? "COLLECTOR";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
