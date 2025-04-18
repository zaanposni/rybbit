import { Filter, FilterParameter, FilterType } from "../../../../../lib/store";
import { getCountryName } from "../../../../../lib/utils";

export function getParameterNameLabel(parameter: FilterParameter) {
  switch (parameter) {
    case "country":
      return "Country";
    case "device_type":
      return "Device Type";
    case "operating_system":
      return "OS";
    case "browser":
      return "Browser";
    case "referrer":
      return "Referrer";
    case "pathname":
      return "Path";
    case "page_title":
      return "Title";
    case "querystring":
      return "Query";
    case "language":
      return "Language";
    case "city":
      return "City";
    case "region":
      return "Region";
    case "entry_page":
      return "Entry Page";
    case "exit_page":
      return "Exit Page";
    case "dimensions":
      return "Dimension";
    case "event_name":
      return "Event Name";
    default:
      return parameter;
  }
}

export const filterTypeToLabel = (type: FilterType) => {
  switch (type) {
    case "equals":
      return "is";
    case "not_equals":
      return "is not";
    case "contains":
      return "contains";
    case "not_contains":
      return "not contains";
    default:
      return type;
  }
};

export function getParameterValueLabel(
  filter: Filter,
  getRegionName: (region: string) => string | undefined
) {
  const formatValue = (value: string) => {
    if (filter.parameter === "country") {
      return getCountryName(value);
    }
    if (filter.parameter === "region") {
      return getRegionName(value);
    }
    return value;
  };

  if (filter.value.length === 1) {
    return formatValue(filter.value[0]);
  }

  // For multiple values, format them and join with commas
  return filter.value.map(formatValue).join(", ");
}
