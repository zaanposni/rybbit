import { Trash } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  Filter,
  FilterParameter,
  FilterType,
  updateFilter,
} from "../../../../../lib/store";
import { FilterOptions, OperatorOptions } from "./const";
import { ValueSelect } from "./ValueSelect";

export function FilterComponent({
  filter,
  index,
  updateFilter,
}: {
  filter: Filter;
  index: number;
  updateFilter: (filter: Filter | null, index: number) => void;
}) {
  return (
    <div className="grid grid-cols-[220px_auto] md:grid-cols-[160px_100px_250px_auto] gap-2">
      <Select
        onValueChange={(value) => {
          updateFilter(
            {
              ...filter,
              value: [],
              parameter: value as FilterParameter,
            },
            index
          );
        }}
        value={filter.parameter}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter" />
        </SelectTrigger>
        <SelectContent>
          {FilterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filter.type}
        onValueChange={(value) => {
          updateFilter(
            {
              ...filter,
              type: value as FilterType,
            },
            index
          );
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {OperatorOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ValueSelect
        onChange={(value) => {
          updateFilter({ ...filter, value: value }, index);
        }}
        parameter={filter.parameter}
        value={filter.value}
      />
      <Button
        variant={"ghost"}
        size={"icon"}
        onClick={() => {
          updateFilter(null, index);
        }}
      >
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  );
}
