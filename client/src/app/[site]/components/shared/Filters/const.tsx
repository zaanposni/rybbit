import {
  AppWindow,
  Brain,
  FileText,
  FolderInput,
  Globe,
  Languages,
  LogIn,
  LogOut,
  MapPinHouse,
  MapPinned,
  Maximize,
  MousePointerClick,
  Radio,
  Search,
  Share2,
  TabletSmartphone,
} from "lucide-react";
import React from "react";
import { FilterParameter } from "../../../../../lib/store";

export const FilterOptions: {
  label: string;
  value: FilterParameter;
  icon: React.ReactNode;
}[] = [
  {
    label: "Path",
    value: "pathname",
    icon: <FolderInput className="h-4 w-4" />,
  },
  {
    label: "Page Title",
    value: "page_title",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "Query",
    value: "querystring",
    icon: <Search className="h-4 w-4" />,
  },
  {
    label: "Event Name",
    value: "event_name",
    icon: <MousePointerClick className="h-4 w-4" />,
  },
  {
    label: "Referrer",
    value: "referrer",
    icon: <Share2 className="h-4 w-4" />,
  },
  {
    label: "Channel",
    value: "channel",
    icon: <Radio className="h-4 w-4" />,
  },
  {
    label: "Entry Page",
    value: "entry_page",
    icon: <LogIn className="h-4 w-4" />,
  },
  {
    label: "Exit Page",
    value: "exit_page",
    icon: <LogOut className="h-4 w-4" />,
  },
  {
    label: "Country",
    value: "country",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    label: "Region",
    value: "region",
    icon: <MapPinned className="h-4 w-4" />,
  },
  {
    label: "City",
    value: "city",
    icon: <MapPinHouse className="h-4 w-4" />,
  },
  {
    label: "Device Type",
    value: "device_type",
    icon: <TabletSmartphone className="h-4 w-4" />,
  },
  {
    label: "Operating System",
    value: "operating_system",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    label: "Browser",
    value: "browser",
    icon: <AppWindow className="h-4 w-4" />,
  },
  {
    label: "Language",
    value: "language",
    icon: <Languages className="h-4 w-4" />,
  },
  {
    label: "Screen Dimensions",
    value: "dimensions",
    icon: <Maximize className="h-4 w-4" />,
  },
];

export const OperatorOptions = [
  { label: "Is", value: "equals" },
  { label: "Is not", value: "not_equals" },
  { label: "Contains", value: "contains" },
  { label: "Not contains", value: "not_contains" },
];
