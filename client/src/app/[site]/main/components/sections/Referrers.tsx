"use client";

import { StandardCard } from "../../../components/shared/StandardCard";

export function Referrers() {
  return (
    <StandardCard
      filterParameter="referrer"
      title="Referrers"
      getKey={(e) => e.value}
      getLink={(e) => `https://${e.value}`}
      getLabel={(e) => (
        <div className="flex items-center">
          <img
            className="w-4 mr-2"
            src={`https://www.google.com/s2/favicons?domain=${e.value}&sz=32`}
          />
          {e.value ? e.value : "Direct"}
        </div>
      )}
      getValue={(e) => e.value}
    />
  );
}
