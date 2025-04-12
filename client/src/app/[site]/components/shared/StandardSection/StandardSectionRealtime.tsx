"use client";

import { ReactNode } from "react";
import {
  SingleColResponse,
  useSingleColRealtime,
} from "../../../../../api/analytics/useSingleCol";
import { FilterParameter } from "../../../../../lib/store";
import { BaseStandardSection } from "./BaseStandardSection";

export function StandardSectionRealtime({
  title,
  getKey,
  getLabel,
  getValue,
  getLink,
  countLabel,
  filterParameter,
}: {
  title: string;
  isFetching?: boolean;
  getKey: (item: SingleColResponse) => string;
  getLabel: (item: SingleColResponse) => ReactNode;
  getValue: (item: SingleColResponse) => string;
  getLink?: (item: SingleColResponse) => string;
  countLabel?: string;
  filterParameter: FilterParameter;
}) {
  const { data, isFetching, error, refetch } = useSingleColRealtime({
    parameter: filterParameter,
  });

  return (
    <BaseStandardSection
      title={title}
      data={data}
      isFetching={isFetching}
      error={error}
      refetch={refetch}
      getKey={getKey}
      getLabel={getLabel}
      getValue={getValue}
      getLink={getLink}
      countLabel={countLabel}
      filterParameter={filterParameter}
    />
  );
}
