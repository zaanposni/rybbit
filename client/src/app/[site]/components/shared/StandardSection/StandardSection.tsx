"use client";

import { ReactNode, useMemo } from "react";
import {
  SingleColResponse,
  useSingleCol,
} from "../../../../../api/analytics/useSingleCol";
import { FilterParameter } from "../../../../../lib/store";
import { BaseStandardSection } from "./BaseStandardSection";

export function StandardSection({
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
  const { data, isFetching, error, refetch } = useSingleCol({
    parameter: filterParameter,
  });

  const { data: previousData, isFetching: previousIsFetching } = useSingleCol({
    parameter: filterParameter,
    periodTime: "previous",
  });

  // Create combined loading state
  const isLoading = isFetching || previousIsFetching;

  // For potential additional features that use previous data
  const previousDataMap = useMemo(() => {
    return previousData?.data?.reduce((acc, curr) => {
      acc[getKey(curr)] = curr;
      return acc;
    }, {} as Record<string, SingleColResponse>);
  }, [previousData, getKey]);

  return (
    <BaseStandardSection
      title={title}
      data={data}
      isFetching={isLoading}
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
