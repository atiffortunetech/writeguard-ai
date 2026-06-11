import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isProtected =
        pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
      const isAuthRoute =
        pathname.startsWith("/login") || pathname.startsWith("/signup");

      if (isProtected && !isLoggedIn) return false;
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      if (pathname.startsWith("/admin") && auth?.user?.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
