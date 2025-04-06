"use client";

import { User } from "@phosphor-icons/react";
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

export function TopBar() {
  const session = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="flex pt-2 pb-2 px-3 items-center w-full  bg-neutral-900 justify-center">
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-lg">
            🐸 Frogstats
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium">
            <User size={16} weight="bold" />
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
      </div>
    </div>
  );
}
