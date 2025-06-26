import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationTable,
} from "../db/schema";
// import { expo } from "@better-auth/expo"; // uncomment (and re-install) when expo app is ready

export const auth = betterAuth({
  plugins: [
    // expo(), // uncomment when expo app is ready
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      account: accountsTable,
      session: sessionsTable,
      verification: verificationTable,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER!, // for expo app
    },
  },
  trustedOrigins: [
    process.env.WEB_FRONTEND_URL!,
    "https://appleid.apple.com", // for Sign In with Apple flows
    // process.env.EXPO_URL!, // uncomment when expo app is ready
  ],
});
