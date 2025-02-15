"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "../../lib/auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const session = authClient.useSession();
  const router = useRouter();

  console.info({ session });

  return (
    <div className="container max-w-6xl py-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your analytics preferences and configurations.
          </p>
        </div>
        <Button
          onClick={async () => {
            await authClient.signOut();
            router.push("/login");
          }}
        >
          Signout
        </Button>
      </div>
    </div>
  );
}
