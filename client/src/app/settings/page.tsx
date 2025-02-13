"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "../../lib/auth";

export default function SettingsPage() {
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
          onClick={() => {
            authClient.signOut();
          }}
        >
          Signout
        </Button>
      </div>
    </div>
  );
}
