import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: false,
      profile(profile) {
        const isAdmin = profile.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
        return {
          id: profile.sub as string,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: isAdmin ? "ADMIN" : "USER",
        } as any;
      },
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }: any) {
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).role = (user as any).role;
      }
      return session;
    },
    async signIn() {
      return true;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
