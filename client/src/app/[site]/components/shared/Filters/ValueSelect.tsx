"use client";

import { useMemo } from "react";

import { getCountryName } from "../../../../../lib/utils";

import { FilterParameter } from "../../../../../lib/store";

import { useSingleCol } from "../../../../../api/analytics/useSingleCol";
import { MultiSelect } from "../../../../../components/MultiSelect";
import { useGetRegionName } from "../../../../../lib/geo";

export function ValueSelect({
  parameter,
  value,
  onChange,
}: {
  parameter: FilterParameter;
  value: string[];
  onChange: (values: string[]) => void;
}) {
  const { data, isLoading } = useSingleCol({
    parameter,
    limit: 1000,
    useFilters: false,
  });

  const { getRegionName } = useGetRegionName();

  const suggestions = useMemo(() => {
    return (
      data?.data
        ?.map((item) => item.value)
        .filter(Boolean)
        .map((val) => {
          if (parameter === "country") {
            return {
              value: val,
              label: getCountryName(val),
            };
          }
          if (parameter === "region") {
            return {
              value: val,
              label: getRegionName(val),
            };
          }
          return {
            value: val,
            label: val,
          };
        }) || []
    );
  }, [data]);

  const handleChange = (selected: any) => {
    const values = selected.map((item: { value: string }) => item.value);
    onChange(values);
  };

  return (
    <MultiSelect
      value={value.map((val) => {
        if (parameter === "country") {
          return { value: val, label: getCountryName(val) };
        }
        if (parameter === "region") {
          return { value: val, label: getRegionName(val) };
        }
        return { value: val, label: val };
      })}
      options={suggestions}
      onChange={handleChange}
      placeholder="Select values..."
      isLoading={isLoading}
    />
  );
}
