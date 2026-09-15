import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { logError } from "@/lib/logging";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: { params: { prompt: "select_account consent" } },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile }) {
      if (
        account?.provider !== "google" ||
        !profile?.email ||
        profile.email_verified !== true
      )
        return false;
      try {
        const email = profile.email.toLowerCase();
        await getDb().transaction(async (tx) => {
          const now = new Date();
          const [user] = await tx
            .insert(users)
            .values({
              email,
              name:
                typeof profile.given_name === "string"
                  ? profile.given_name
                  : profile.name,
              surname:
                typeof profile.family_name === "string"
                  ? profile.family_name
                  : null,
              signinDate: now,
              lastSigninDate: now,
            })
            .onConflictDoUpdate({
              target: users.email,
              set: { lastSigninDate: now, updatedAt: now },
            })
            .returning();
          if (!user.signinDate)
            await tx
              .update(users)
              .set({ signinDate: now })
              .where(eq(users.id, user.id));
          await tx.insert(auditLogs).values({
            userId: user.id,
            userEmail: email,
            action: "login",
            entityType: "user",
            entityId: user.id,
            summary: "Google sign-in",
          });
        });
        return true;
      } catch (error) {
        await logError("auth.signIn", error);
        return false;
      }
    },
  },
  logger: {
    error: (error) => {
      void logError("auth", error);
    },
  },
});
