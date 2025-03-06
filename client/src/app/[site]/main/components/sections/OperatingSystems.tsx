"use client";

import { StandardCard } from "../../../components/shared/StandardCard";
import { OperatingSystem } from "../../../components/shared/icons/OperatingSystem";

export function OperatingSystems() {
  return (
    <StandardCard
      title="Operating Systems"
      getValue={(e) => e.value}
      getKey={(e) => e.value}
      getLabel={(e) => (
        <div className="flex gap-2 items-center">
          <OperatingSystem os={e.value || "Other"} />
          {e.value || "Other"}
        </div>
      )}
      filterParameter="operating_system"
    />
  );
}
