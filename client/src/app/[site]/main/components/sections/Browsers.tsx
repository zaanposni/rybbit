"use client";

import { StandardCard } from "../../../components/shared/StandardCard";
import { Browser } from "../../../components/shared/icons/Browser";

export function Browsers() {
  return (
    <StandardCard
      title="Browsers"
      getKey={(e) => e.value}
      getLabel={(e) => (
        <div className="flex gap-2 items-center">
          <Browser browser={e.value} />
          {e.value || "Other"}
        </div>
      )}
      getValue={(e) => e.value}
      filterParameter="browser"
    />
  );
}
