import { usernameClient, adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Determine if we should use the API proxy path or direct backend URL
const baseURL =
  process.env.NODE_ENV === "production"
    ? "/api" // When deployed, use relative path for Next.js proxy
    : process.env.NEXT_PUBLIC_BACKEND_URL; // For development, use direct URL

export const authClient = createAuthClient({
  baseURL,
  plugins: [usernameClient(), adminClient()],
  fetchOptions: {
    credentials: "include",
  },
});
