import { X } from "lucide-react";
import {
  Filter,
  FilterParameter,
  FilterType,
  removeFilter,
  updateFilter,
  useStore,
} from "../../../../../lib/store";
import { getCountryName } from "../../../../../lib/utils";
import { NewFilterButton } from "./NewFilterButton";
import { useGetRegionName } from "../../../../../lib/geo";
import {
  filterTypeToLabel,
  getParameterNameLabel,
  getParameterValueLabel,
} from "../../shared/Filters/utils";

export function Filters() {
  const { filters } = useStore();
  const { getRegionName } = useGetRegionName();

  return (
    <div className="flex gap-2">
      <NewFilterButton />
      {filters?.map((filter, i) => (
        <div
          key={filter.parameter}
          className="px-2 py-1 rounded-md bg-neutral-850 text-neutral-400 flex items-center gap-1 text-sm"
        >
          <div className="text-neutral-300">
            {getParameterNameLabel(filter.parameter)}
          </div>
          <div
            className={`text-emerald-400 font-medium cursor-pointer ${
              filter.type === "not_equals" || filter.type === "not_contains"
                ? "text-red-400"
                : ""
            }`}
            onClick={() => {
              let newType: FilterType = "equals";
              if (filter.type === "equals") {
                newType = "not_equals";
              } else if (filter.type === "not_equals") {
                newType = "contains";
              } else if (filter.type === "contains") {
                newType = "not_contains";
              } else if (filter.type === "not_contains") {
                newType = "equals";
              }

              updateFilter({ ...filter, type: newType }, i);
            }}
          >
            {filterTypeToLabel(filter.type)}
          </div>
          <div className="text-neutral-100 font-medium">
            {getParameterValueLabel(filter, getRegionName)}
          </div>
          <div
            className="text-neutral-400 cursor-pointer hover:text-neutral-200"
            onClick={() => removeFilter(filter)}
          >
            <X size={16} strokeWidth={3} />
          </div>
        </div>
      ))}
    </div>
  );
}
