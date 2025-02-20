"use client";

import { GearSix } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { authClient } from "../lib/auth";
import { Button } from "./ui/button";
import { User } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function TopBar() {
  const session = authClient.useSession();
  const router = useRouter();
  return (
    <div className="flex pt-2 items-center w-full pb-4 bg-neutral-900 justify-center">
      <div className="flex items-center justify-between max-w-6xl flex-1">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl">
            🐸 Frogstats
          </Link>
        </div>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className="text-neutral-100 flex items-center gap-1 text-sm font-medium">
                  Websites
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        {/* <nav className="ml-auto flex items-center space-x-6 text-sm">
          <Link href="/" className="text-neutral-100">
            Websites
          </Link>
          <Link
            href="/settings"
            className="text-neutral-100 flex items-center gap-1"
          >
            <GearSix size={18} weight="bold" />
            Settings
          </Link>
          <ThemeToggle />
        </nav> */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium">
            <User size={16} weight="bold" />
            {session.data?.user.name}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href="/settings" legacyBehavior passHref>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
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
