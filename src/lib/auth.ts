import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByAccount,
  findUserByEmail,
  findUserById,
  linkAccount,
} from "@/lib/db";
import { ensureOwnerIsAdmin, roleForNewUser } from "@/lib/owner";
import { authConfig } from "@/lib/auth.config";
import type { UserRole } from "@/types/database";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers.filter((p) => p.id !== "credentials"),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await findUserByEmail(email);

          if (!user?.passwordHash || user.banned) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          const dbUser = await ensureOwnerIsAdmin(user);

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
            role: dbUser.role,
          };
        } catch (err) {
          console.error("Credentials auth database error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const provider = account.provider;
      const providerAccountId = account.providerAccountId;
      const email = user.email;

      if (!provider || !providerAccountId || !email) {
        return false;
      }

      let dbUser = await findUserByAccount(provider, providerAccountId);

      if (!dbUser) {
        dbUser = await findUserByEmail(email);
      }

      if (!dbUser) {
        dbUser = await createUser({
          email,
          name: user.name,
          image: user.image,
          emailVerified: new Date(),
          role: roleForNewUser(email),
        });
      }

      dbUser = await ensureOwnerIsAdmin(dbUser);

      if (dbUser.banned) {
        return false;
      }

      const linkedUser = await findUserByAccount(provider, providerAccountId);
      if (!linkedUser) {
        await linkAccount({
          userId: dbUser.id,
          type: account.type,
          provider,
          providerAccountId,
          refreshToken: account.refresh_token ?? null,
          accessToken: account.access_token ?? null,
          expiresAt: account.expires_at ?? null,
          tokenType: account.token_type ?? null,
          scope: account.scope ?? null,
          idToken: account.id_token ?? null,
          sessionState:
            typeof account.session_state === "string"
              ? account.session_state
              : null,
        });
      }

      user.id = dbUser.id;
      user.role = dbUser.role;
      user.email = dbUser.email;
      user.name = dbUser.name;
      user.image = dbUser.image;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      } else if (token.id) {
        const dbUser = await findUserById(token.id as string);
        if (dbUser && !dbUser.banned) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}
