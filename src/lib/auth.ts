import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { CredentialsSignin } from "next-auth";
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
  twoFactorCode: z.string().optional(),
});

// Errori restituiti al client tramite result.code: la pagina di login li usa
// per chiedere il codice a 6 cifre o spiegare il blocco, senza rivelare altro.
// Auth.js propaga solo istanze di CredentialsSignin (con il relativo `code`)
// nell'URL di redirect: un `throw new Error(...)` generico viene sostituito
// da un codice muto ("Configuration") e il messaggio si perde — per questo
// non basta più lanciare un Error semplice come si faceva prima.
export const TWO_FACTOR_REQUIRED = "2FA_REQUIRED";
export const TWO_FACTOR_INVALID = "2FA_INVALID";
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  // Sessione più corta del default (30 giorni): su una piattaforma con
  // pagamenti riduce la finestra utile a un token rubato
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google verifies email ownership, so linking to the existing
      // credentials account with the same email is safe
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;
        if (user.isBlocked || user.deletedAt) return null;

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

        // La registrazione crea l'account subito e invia l'email di verifica,
        // ma senza questo controllo chiunque poteva accedere inserendo un
        // indirizzo email inesistente o non proprio: la password da sola
        // dimostra solo che l'utente conosce quella password, non che
        // l'email sia reale o gli appartenga.
        if (!user.emailVerified) {
          await logActivity(user.id, "LOGIN_FAILED", "Email non verificata");
          throw new LoginError(EMAIL_NOT_VERIFIED);
        }

        // Secondo fattore: se attivo, la password da sola non basta
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const code = parsed.data.twoFactorCode?.trim();
          if (!code) throw new LoginError(TWO_FACTOR_REQUIRED);

          const { verify } = await import("otplib");
          const result = await verify({ token: code, secret: user.twoFactorSecret });
          if (!result?.valid) {
            // Un codice errato conta come tentativo fallito (anti forza bruta)
            const failCount = (user.failedLoginAttempts || 0) + 1;
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failCount,
                ...(failCount >= MAX_FAILED_ATTEMPTS
                  ? { lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) }
                  : {}),
              },
            });
            await logActivity(user.id, "LOGIN_FAILED", "Codice 2FA errato");
            throw new LoginError(TWO_FACTOR_INVALID);
          }
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
  callbacks: {
    async signIn({ user, account }) {
      // Google can only log in users who already completed the normal
      // registration (email + password). It never creates new accounts.
      if (account?.provider === "google") {
        if (!user.email) return "/it/login?error=google_not_registered";
        const existing = await db.user.findUnique({
          where: { email: user.email },
          select: { password: true, isBlocked: true, deletedAt: true },
        });
        if (!existing?.password) return "/it/login?error=google_not_registered";
        if (existing.isBlocked || existing.deletedAt) return "/it/login?error=blocked";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        const dbUser = await db.user.findUnique({
          where: { id: user.id! },
          select: { role: true },
        });
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
