import { FilterParameter } from "../../../../../lib/store";

export const FilterOptions: { label: string; value: FilterParameter }[] = [
  {
    label: "Path",
    value: "pathname",
  },
  {
    label: "Page Title",
    value: "page_title",
  },
  {
    label: "Query",
    value: "querystring",
  },
  {
    label: "Referrer",
    value: "referrer",
  },
  {
    label: "Channel",
    value: "channel",
  },
  {
    label: "Country",
    value: "country",
  },
  {
    label: "Region",
    value: "iso_3166_2",
  },
  {
    label: "City",
    value: "city",
  },
  {
    label: "Device Type",
    value: "device_type",
  },
  {
    label: "Operating System",
    value: "operating_system",
  },
  {
    label: "Browser",
    value: "browser",
  },
  {
    label: "Language",
    value: "language",
  },
  {
    label: "Entry Page",
    value: "entry_page",
  },
  {
    label: "Exit Page",
    value: "exit_page",
  },
  {
    label: "Screen Dimensions",
    value: "dimensions",
  },
  {
    label: "Event Name",
    value: "event_name",
  },
];

export const OperatorOptions = [
  { label: "Is", value: "equals" },
  { label: "Is not", value: "not_equals" },
  { label: "Contains", value: "contains" },
  { label: "Not contains", value: "not_contains" },
];
