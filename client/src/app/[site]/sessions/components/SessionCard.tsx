import { useState } from "react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { Browser } from "../../components/shared/icons/Browser";
import { CountryFlag } from "../../components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../components/shared/icons/OperatingSystem";
import { getCountryName } from "../../../../lib/utils";
import {
  Laptop,
  Smartphone,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Clock,
} from "lucide-react";
import Avatar from "boring-avatars";
import { GetSessionsResponse } from "../../../../api/analytics/userSessions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionCardProps {
  session: GetSessionsResponse[number];
  onClick?: () => void;
}

// DeviceIcon component for displaying mobile/desktop icons
function DeviceIcon({ deviceType }: { deviceType: string }) {
  const type = deviceType.toLowerCase();

  if (type.includes("mobile") || type.includes("tablet")) {
    return <Smartphone className="w-4 h-4" />;
  }

  return <Laptop className="w-4 h-4" />;
}

// Function to truncate path for display
function truncatePath(path: string, maxLength: number = 32) {
  if (!path) return "-";
  if (path.length <= maxLength) return path;

  // Keep the beginning of the path with ellipsis
  return `${path.substring(0, maxLength)}...`;
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  // Calculate session duration in minutes
  const start = DateTime.fromSQL(session.session_start);
  const end = DateTime.fromSQL(session.session_end);
  const duration = end.diff(start, ["minutes", "seconds"]);
  const durationFormatted = `${Math.floor(duration.minutes)}m ${Math.floor(
    duration.seconds
  )}s`;

  // Truncate user ID to first 8 characters
  const truncatedUserId = session.user_id.substring(0, 8);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <div
      className="mb-3 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="p-3 cursor-pointer">
        <div className="flex items-center gap-2">
          {/* Avatar and User ID */}
          <div className="flex items-center gap-2">
            <Avatar
              name={session.user_id}
              colors={["#2c2b4b", "#a75293", "#9c7a9d", "#9ddacb", "#f8dcb4"]}
              variant="beam"
              size={24}
            />
            <span className="text-xs font-mono text-gray-400">
              {truncatedUserId}
            </span>
          </div>

          {/* Icons section */}
          <div className="flex space-x-2 items-center ml-3">
            {/* Country */}
            {session.country && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <CountryFlag country={session.country} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getCountryName(session.country)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Browser */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Browser browser={session.browser || "Unknown"} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.browser || "Unknown browser"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* OS */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <OperatingSystem os={session.operating_system || ""} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.operating_system || "Unknown OS"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Device Type */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DeviceIcon deviceType={session.device_type || ""} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.device_type || "Unknown device"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Pages section with tooltips for long paths */}
          <div className="flex items-center ml-3 flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-400 truncate max-w-[200px] inline-block">
                    {truncatePath(session.entry_page)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.entry_page || "-"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ArrowRight className="mx-2 w-3 h-3 flex-shrink-0 text-gray-400" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-gray-400 truncate max-w-[200px] inline-block">
                    {truncatePath(session.exit_page)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{session.exit_page || "-"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Time information */}
          <div className="flex items-center gap-2 ml-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{durationFormatted}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {DateTime.fromSQL(session.session_start).toFormat(
                      "MMM d, h:mm a"
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Expand/Collapse icon */}
          <div className="ml-3 flex-shrink-0">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content - to be implemented later */}
      {expanded && (
        <div className="px-4 pb-4 bg-neutral-850 border-t border-neutral-800">
          {/* This will be implemented later */}
        </div>
      )}
    </div>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="mb-3 rounded-lg bg-neutral-900 border border-neutral-800 p-3">
      <div className="flex items-center">
        {/* Avatar and User ID */}
        <div className="flex items-center gap-2 min-w-[110px]">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Icons */}
        <div className="flex space-x-2 items-center ml-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
        </div>

        {/* Entry/Exit paths */}
        <div className="flex items-center ml-3 flex-1 min-w-0">
          <Skeleton className="h-3 w-20" />
          <div className="mx-2">
            <Skeleton className="h-3 w-3" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Time */}
        <div className="ml-3">
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Expand icon */}
        <div className="ml-3 flex-shrink-0">
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
