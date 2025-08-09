import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import * as dotenvx from "@dotenvx/dotenvx";

const GOOGLE_CLIENT_ID = dotenvx.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = dotenvx.get("GOOGLE_CLIENT_SECRET");
const NEXTAUTH_SECRET = dotenvx.get("NEXTAUTH_SECRET");
const AUTHORIZED_EMAILS = dotenvx.get("AUTHORIZED_EMAILS")?.split(",") || [];

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: GOOGLE_CLIENT_ID!,
            clientSecret: GOOGLE_CLIENT_SECRET!,
        }),
    ],
    secret: NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                const email = user.email;
                if (email && AUTHORIZED_EMAILS.includes(email)) {
                    return true;
                }
                return false;
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            return baseUrl;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
};
