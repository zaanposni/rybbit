"use client";

import { GetSitesResponse } from "@/hooks/api";
import { StandardCard } from "../../../components/shared/StandardCard";

export function Pages({
  siteMetadata,
}: {
  siteMetadata: GetSitesResponse[number];
}) {
  return (
    <StandardCard
      filterParameter="pathname"
      title="Pages"
      getValue={(e) => e.value}
      getKey={(e) => e.value}
      getLabel={(e) => e.value || "Other"}
      getLink={(e) => `https://${siteMetadata.domain}${e.value}`}
    />
  );
}
