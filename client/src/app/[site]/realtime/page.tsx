"use client";

import { Countries } from "../main/components/sections/Countries";
import { Events } from "../main/components/sections/Events";
import { Pages } from "../main/components/sections/Pages";
import { Referrers } from "../main/components/sections/Referrers";
import { RealtimeMap } from "./RealtimeMap/RealtimeMap";

export default function RealtimePage() {
  return (
    <div className="flex flex-col gap-4">
      <RealtimeMap />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Pages isRealtime />
        <Events isRealtime />
        <Referrers isRealtime />
        <Countries isRealtime />
      </div>
    </div>
  );
}
