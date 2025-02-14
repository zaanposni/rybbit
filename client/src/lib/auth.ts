import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL?.replace("/api", ""), // the base url of your auth server
  plugins: [usernameClient()],
  fetchOptions: {
    credentials: "include",
  },
});
