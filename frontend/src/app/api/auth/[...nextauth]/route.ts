import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8500";

const handler = NextAuth({
  providers: [
    // --- Credentials (existing admin/password flow) ---
    CredentialsProvider({
      name: "VisualPC",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post(`${API_URL}/auth/login`, {
            username: credentials?.username,
            password: credentials?.password,
          });
          if (res.data?.access_token) {
            return {
              id: credentials?.username ?? "admin",
              name: credentials?.username,
              email: `${credentials?.username}@visualpc.local`,
              accessToken: res.data.access_token,
              role: "admin",
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),

    // --- Google OAuth (optional — needs env vars) ---
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),

    // --- GitHub OAuth (optional — needs env vars) ---
    ...(process.env.GITHUB_ID
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
          }),
        ]
      : []),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.accessToken = u.accessToken;
        token.role = u.role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).accessToken = token.accessToken;
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },

  secret: process.env.NEXTAUTH_SECRET || "visualpc-nextauth-secret-change-me",
});

export { handler as GET, handler as POST };
