import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {supabaseServer} from "@/lib/supabaseServer";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      console.log("User",user)
      // 1. Check if user already exists
      const { data: existingUser } = await supabaseServer
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();
      console.log("Existing user",existingUser)
      // 2. If user does NOT exist → create new user
      if (!existingUser) {
        await supabaseServer.from("users").insert({
          name: user.name,
          email: user.email,
          avatar_url: user.image
        });
      }

      return true; // allow login
    },
        async jwt({ token }) {
      // Fetch the user's Supabase profile using email
      if (token.email) {
        const { data: dbUser } = await supabaseServer
          .from("users")
          .select("*")
          .eq("email", token.email)
          .single();

        if (dbUser) {
          token.id = dbUser.id; // SUPABASE UUID ✔
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
       // session.user.email=token.email as string;
        //session.user.avatar_url=token.picture as string;
      }
      return session;
    },
  },
};
