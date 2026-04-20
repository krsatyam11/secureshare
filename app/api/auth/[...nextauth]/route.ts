// File: app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { type: "text" }, password: { type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        let user = await prisma.user.findUnique({ where: { email: credentials.email } });
        
        // Auto-register if user doesn't exist (for ease of use)
        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          user = await prisma.user.create({
            data: { email: credentials.email, password: hashedPassword },
          });
        } else {
          const isValid = await bcrypt.compare(credentials.password, user.password!);
          if (!isValid) return null;
        }
        return { id: user.id, email: user.email };
      }
    })
  ],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };