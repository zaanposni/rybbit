"use client";

import { getCountryName } from "../../../../../lib/utils";
import { StandardCard } from "../../../components/shared/StandardCard";
import { CountryFlag } from "../../../components/shared/icons/CountryFlag";

export function Countries() {
  return (
    <StandardCard
      title="Countries"
      getKey={(e) => e.value}
      getLabel={(e) => (
        <span className="flex items-center gap-2">
          {e.value && getCountryName(e.value) ? (
            <>
              <CountryFlag country={e.value} />
              {getCountryName(e.value)}
            </>
          ) : (
            "Unknown"
          )}
        </span>
      )}
      getValue={(e) => e.value}
      filterParameter="country"
    />
  );
}
