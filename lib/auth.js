import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function firstDefined(...values) {
  return values.find((value) => Boolean(value));
}

const googleClientId = firstDefined(
  process.env.AUTH_GOOGLE_ID,
  process.env.GOOGLE_CLIENT_ID,
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
);
const googleClientSecret = firstDefined(
  process.env.AUTH_GOOGLE_SECRET,
  process.env.GOOGLE_CLIENT_SECRET
);
const authSecret = firstDefined(process.env.AUTH_SECRET, process.env.NEXTAUTH_SECRET);

export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret && authSecret);

const providers = [];

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: authSecret,
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile, account }) {
      if (account?.provider === "google" && profile) {
        token.picture = profile.picture || token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture || session.user.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
