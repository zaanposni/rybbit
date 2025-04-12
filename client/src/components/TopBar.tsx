"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User } from "lucide-react";
import { Button } from "./ui/button";

export function TopBar() {
  const session = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="flex py-1 px-3 items-center w-full  bg-neutral-900 justify-center">
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-semibold text-base">
            🐸 Frogstats
          </Link>
        </div>
        {session.data ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 text-xs font-medium px-2 py-0"
              variant="ghost"
            >
              <User className="w-4 h-4" />
              {session.data?.user.name}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href="/settings/account" legacyBehavior passHref>
                <DropdownMenuItem>Settings</DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={async () => {
                  // Clear the query cache before signing out
                  queryClient.clear();
                  await authClient.signOut();
                  router.push("/login");
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/signup" legacyBehavior passHref>
            <Button variant="ghost" size="sm">
              Sign up
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
