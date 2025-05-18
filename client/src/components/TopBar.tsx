"use client";

import { useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { IS_DEMO } from "../lib/const";

export function TopBar() {
  const session = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="flex py-2 pr-3 pl-6 items-center w-full  bg-neutral-950 justify-center border-b border-neutral-750">
      <div className="flex items-center justify-between flex-1">
        <div className="flex items-center space-x-4">
          <Link href={session.data ? "/" : "https://rybbit.io"}>
            <Logo size="small" />
          </Link>
        </div>
        {session.data ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 text-xs font-medium px-2 py-0"
              variant="ghost"
              size="xs"
            >
              <User className="w-4 h-4" />
              {session.data?.user.name}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href="/settings/account" passHref>
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
              {session.data.user.role === "admin" && (
                <Link href="/admin" passHref>
                  <DropdownMenuItem>Admin</DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : IS_DEMO ? (
          <Link href="https://app.rybbit.io/signup" passHref>
            <Button variant="ghost" size="xs">
              Sign up
            </Button>
          </Link>
        ) : (
          <Link href="/signup" passHref>
            <Button variant="ghost" size="xs">
              Sign up
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
