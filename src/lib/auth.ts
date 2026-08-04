import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import {
  clearLoginFailures,
  getLoginKey,
  isLoginBlocked,
  recordLoginFailure,
} from "./login-rate-limit";

const SESSION_MAX_AGE_SECONDS = 30 * 60; // Sesi kedaluwarsa setelah 30 menit tanpa aktivitas
const DUMMY_PASSWORD_HASH = "$2b$12$9vN1qXx0nhKA6AS8h5JOU.LRiWfTqKJX48Xq5C8niagv0oMH4zEDO";
const LOGIN_ERROR = "Email atau kata sandi salah";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" }
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(LOGIN_ERROR);
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        const loginKey = getLoginKey(email, request.headers);

        if (!email || email.length > 254 || password.length > 128 || isLoginBlocked(loginKey)) {
          throw new Error(LOGIN_ERROR);
        }

        const user = await prisma.user.findUnique({
          where: { email }
        });

        // Hash tiruan menyamakan waktu respons untuk email yang belum terdaftar.
        const isPasswordValid = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);

        if (!user || !isPasswordValid) {
          recordLoginFailure(loginKey);
          throw new Error(LOGIN_ERROR);
        }

        clearLoginFailures(loginKey);

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          image: user.imageUrl,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      if (token.id) {
        const latestUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { name: true, email: true, imageUrl: true, role: true },
        });
        if (latestUser) {
          token.name = latestUser.name;
          token.email = latestUser.email;
          token.picture = latestUser.imageUrl;
          token.role = latestUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 5 * 60, // Perbarui cookie sesi setiap 5 menit jika ada aktivitas
  },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  secret: process.env.NEXTAUTH_SECRET,
};
