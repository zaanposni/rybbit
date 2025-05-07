"use client";

import { authClient } from "@/lib/auth";
import { AccountInner } from "./components/AccountInner";
import { useSetPageTitle } from "../../../hooks/useSetPageTitle";

export default function AccountPage() {
  useSetPageTitle("Rybbit · Account");
  const session = authClient.useSession();

  if (!session.data) {
    return null;
  }

  return <AccountInner session={session} />;
}
