"use client";

import { SubHeader } from "../components/SubHeader/SubHeader";
import SessionsList from "@/components/Sessions/SessionsList";

export default function SessionsPage() {
  return (
    <div>
      <SubHeader />
      <SessionsList />
    </div>
  );
}
