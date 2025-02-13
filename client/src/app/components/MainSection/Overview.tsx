"use client";

import { Duration } from "luxon";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { useGetOverview } from "../../../hooks/api";
import { formatter } from "../../../lib/utils";

const ChangePercentage = ({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) => {
  const change = ((current - previous) / previous) * 100;

  if (change === 0) {
    return (
      <Badge variant="minimal" className="text-xs">
        0%
      </Badge>
    );
  }

  return (
    <Badge variant={change > 0 ? "green" : "red"} className="text-xs">
      {change > 0 ? "+" : ""}
      {change.toFixed(0)}%
    </Badge>
  );
};

const Stat = ({
  title,
  value,
  previous,
  valueFormatter,
  isLoading,
}: {
  title: string;
  value: number;
  previous: number;
  valueFormatter?: (value: number) => string;
  isLoading: boolean;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="text-3xl font-medium flex gap-2 items-center">
        {isLoading ? (
          <>
            <Skeleton className="w-[60px] h-7 rounded-md" />
            <Skeleton className="w-[30px] h-5 rounded-md" />
          </>
        ) : (
          <>
            {valueFormatter ? valueFormatter(value) : value}
            <ChangePercentage current={value} previous={previous} />
          </>
        )}
      </div>
    </div>
  );
};

export function Overview() {
  const {
    data: overviewData,
    isFetching: isOverviewFetching,
    isLoading: isOverviewLoading,
    error: overviewError,
  } = useGetOverview();
  const { data: overviewDataPrevious, isLoading: isOverviewLoadingPrevious } =
    useGetOverview("previous");

  const isLoading = isOverviewLoading || isOverviewLoadingPrevious;

  const currentUsers = overviewData?.data?.users ?? 0;
  const previousUsers = overviewDataPrevious?.data?.users ?? 0;

  const currentSessions = overviewData?.data?.sessions ?? 0;
  const previousSessions = overviewDataPrevious?.data?.sessions ?? 0;

  const currentPageviews = overviewData?.data?.pageviews ?? 0;
  const previousPageviews = overviewDataPrevious?.data?.pageviews ?? 0;

  const currentPagesPerSession = overviewData?.data?.pages_per_session ?? 0;
  const previousPagesPerSession =
    overviewDataPrevious?.data?.pages_per_session ?? 0;

  const currentBounceRate = overviewData?.data?.bounce_rate ?? 0;
  const previousBounceRate = overviewDataPrevious?.data?.bounce_rate ?? 0;

  const currentSessionDuration = overviewData?.data?.session_duration ?? 0;
  const previousSessionDuration =
    overviewDataPrevious?.data?.session_duration ?? 0;

  return (
    <div className="flex gap-6 items-center">
      <Stat
        title="Unique Users"
        value={currentUsers}
        previous={previousUsers}
        isLoading={isLoading}
        valueFormatter={formatter}
      />
      <Stat
        title="Sessions"
        value={currentSessions}
        previous={previousSessions}
        isLoading={isLoading}
        valueFormatter={formatter}
      />
      <Stat
        title="Pageviews"
        value={currentPageviews}
        previous={previousPageviews}
        isLoading={isLoading}
        valueFormatter={formatter}
      />
      <Stat
        title="Pages per Session"
        value={currentPagesPerSession}
        previous={previousPagesPerSession}
        isLoading={isLoading}
        valueFormatter={(value) => value.toFixed(1)}
      />
      <Stat
        title="Bounce Rate"
        value={currentBounceRate}
        previous={previousBounceRate}
        isLoading={isLoading}
        valueFormatter={(value) => `${(value * 100).toFixed(1)}%`}
      />
      <Stat
        title="Session Duration"
        value={currentSessionDuration}
        previous={previousSessionDuration}
        isLoading={isLoading}
        valueFormatter={(value) => {
          const duration = Duration.fromMillis(value * 1000);
          const hours = Math.floor(duration.as("hours"));
          const minutes = Math.floor(duration.as("minutes") % 60);
          const seconds = Math.floor(duration.as("seconds") % 60);

          if (hours > 0) {
            return `${hours}hr ${minutes}min`;
          } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
          } else {
            return `${seconds}s`;
          }
        }}
      />
    </div>
  );
}
