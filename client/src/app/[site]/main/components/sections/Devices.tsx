"use client";

import { StandardCard } from "../../../components/shared/StandardCard";

export function Devices() {
  return (
    <StandardCard
      filterParameter="device_type"
      title="Devices"
      getValue={(e) => e.value}
      getKey={(e) => e.value}
      getLabel={(e) => e.value || "Other"}
    />
  );
}
