"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TopBar } from "@/components/TopBar";
import { authClient } from "../lib/auth";
import { redirect } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Session, set, User } from "better-auth";
import { create } from "zustand";

const inter = Inter({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "Frogstats Analytics",
  description: "Analytics dashboard for your web applications",
};
const publicRoutes = ["/login"];

export const userStore = create<{
  user: User | null;
  isPending: boolean;
  setSession: (user: User) => void;
  setIsPending: (isPending: boolean) => void;
}>((set) => ({
  user: null,
  isPending: true,
  setSession: (user) => set({ user }),
  setIsPending: (isPending) => set({ isPending }),
}));

authClient.getSession().then(({ data: session }) => {
  userStore.setState({
    user: session?.user,
    isPending: false,
  });
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isPending } = userStore();

  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !user && !publicRoutes.includes(pathname)) {
      redirect("/login");
    }
  }, [isPending, user, pathname]);

  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <body
        className={`${inter.className} h-full bg-background text-foreground`}
      >
        <script
          type="module"
          defer
          src="https://cdn.jsdelivr.net/npm/ldrs/dist/auto/zoomies.js"
        ></script>
        <ThemeProvider>
          <QueryProvider>
            <div className="min-h-full">
              <TopBar />
              <main className="flex-1">{children}</main>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
