"use client";

import { UserSessionsResponse, useGetUserSessions } from "@/hooks/api";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Browser } from "../../components/shared/icons/Browser";
import { OperatingSystem } from "../../components/shared/icons/OperatingSystem";
import { CountryFlag } from "../../components/shared/icons/CountryFlag";
import { getCountryName } from "@/lib/utils";
import { useGetSiteMetadata } from "../../../../hooks/hooks";
import { useStore } from "../../../../lib/store";
import { DateTime } from "luxon";

// Helper function to format duration in seconds to a readable format
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds} sec`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes} min`;
  return `${minutes} min ${remainingSeconds} sec`;
};

// Helper function to combine pathname and querystring correctly
const getFullPath = (pathname: string, querystring: string): string => {
  if (!querystring) return pathname;

  // Check if querystring already starts with ? and avoid adding another one
  const prefix = querystring.startsWith("?") ? "" : "?";
  return `${pathname}${prefix}${querystring}`;
};

// Referrer icon component
const ReferrerIcon = ({ referrer }: { referrer: string }) => {
  return (
    <div
      className="text-gray-400 hover:text-gray-300 cursor-help"
      title={referrer}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path
          fillRule="evenodd"
          d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
};

export default function UserPage() {
  const { userId } = useParams();
  const { data, isLoading, error } = useGetUserSessions(userId as string);
  const { site } = useStore();
  const { siteMetadata, isLoading: isLoadingSiteMetadata } =
    useGetSiteMetadata(site);
  console.info(data);

  // Sessions are now pre-grouped by the server
  const groupedSessions = data?.data || [];

  if (error) {
    return <div className="p-6">Error: {(error as Error).message}</div>;
  }

  return (
    <div className="mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">User Profile: {userId}</h1>
        <div className="text-sm text-gray-400">
          {groupedSessions.length > 0
            ? `${groupedSessions.length} sessions recorded`
            : isLoading
            ? "Loading user data..."
            : "No sessions found for this user"}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6"
            >
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSessions.map((session: UserSessionsResponse[number]) => (
            <div
              key={session.session_id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6"
            >
              <div className="mb-4">
                <h2 className="text-xl font-medium mb-2">
                  {DateTime.fromSQL(session.firstTimestamp).toFormat(
                    "MMM d, yyyy h:mm a"
                  )}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Browser browser={session.browser || "Unknown"} />
                    {session.browser || "Unknown"}
                  </div>
                  <div className="flex items-center gap-2">
                    <OperatingSystem
                      os={session.operating_system || "Unknown"}
                    />
                    {session.operating_system || "Unknown"}
                  </div>
                  <div>{session.device_type || "Unknown Device"}</div>
                  <div className="flex items-center gap-2">
                    <CountryFlag country={session.country || "Unknown"} />
                    {getCountryName(session.country || "Unknown")}
                  </div>
                  <div>Duration: {formatDuration(session.duration)}</div>
                </div>
              </div>

              <div className="space-y-4">
                {session.pageviews.map(
                  (
                    pageview: {
                      pathname: string;
                      querystring: string;
                      title: string;
                      timestamp: string;
                      referrer: string;
                    },
                    index: number
                  ) => {
                    const fullPath = getFullPath(
                      pageview.pathname,
                      pageview.querystring
                    );
                    return (
                      <div
                        key={index}
                        className="pl-4 border-l-2 border-neutral-800 grid grid-cols-[100px_1fr_auto] items-center gap-4"
                      >
                        <div className="text-gray-400">
                          {DateTime.fromSQL(pageview.timestamp).toFormat(
                            "h:mm:ss a"
                          )}
                        </div>
                        <div className="text-gray-200 overflow-hidden">
                          <a
                            href={`https://${siteMetadata?.domain}${fullPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline block truncate"
                            title={`https://${siteMetadata?.domain}${fullPath}`}
                          >
                            {fullPath}
                          </a>
                        </div>
                        {pageview.referrer ? (
                          <ReferrerIcon referrer={pageview.referrer} />
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
