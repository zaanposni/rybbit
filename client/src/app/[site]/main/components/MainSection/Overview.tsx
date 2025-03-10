"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOverview } from "@/hooks/api";
import { cn, formatSecondsAsMinutesAndSeconds, formatter } from "@/lib/utils";
import { StatType, useStore } from "../../../../../lib/store";

const ChangePercentage = ({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) => {
  const change = ((current - previous) / previous) * 100;

  if (previous === 0) {
    if (current === 0) {
      return (
        <Badge variant="minimal" className="text-xs">
          0%
        </Badge>
      );
    }
    return (
      <Badge className="text-xs" variant="green">
        +999%
      </Badge>
    );
  }

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
  id,
  value,
  previous,
  valueFormatter,
  isLoading,
}: {
  title: string;
  id: StatType;
  value: number;
  previous: number;
  valueFormatter?: (value: number) => string;
  isLoading: boolean;
}) => {
  const { selectedStat, setSelectedStat } = useStore();
  return (
    <div
      className={cn(
        "flex flex-col hover:bg-neutral-800 rounded-md px-3 py-2 cursor-pointer",
        selectedStat === id && "bg-neutral-850"
      )}
      onClick={() => setSelectedStat(id)}
    >
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="text-2xl font-medium flex gap-2 items-center">
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
  const { site } = useStore();
  const {
    data: overviewData,
    isFetching: isOverviewFetching,
    isLoading: isOverviewLoading,
    error: overviewError,
  } = useGetOverview({ site });
  const { data: overviewDataPrevious, isLoading: isOverviewLoadingPrevious } =
    useGetOverview({ site, periodTime: "previous" });

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
    <div className="flex gap-0 items-center">
      <Stat
        title="Unique Users"
        id="users"
        value={currentUsers}
        previous={previousUsers}
        isLoading={isLoading}
        valueFormatter={formatter}
      />
      <Stat
        title="Sessions"
        id="sessions"
        value={currentSessions}
        previous={previousSessions}
        isLoading={isLoading}
        valueFormatter={formatter}
      />
      <Stat
        title="Pageviews"
        id="pageviews"
        value={currentPageviews}
        previous={previousPageviews}
        isLoading={isLoading}
        valueFormatter={formatter}
      />
      <Stat
        title="Pages per Session"
        id="pages_per_session"
        value={currentPagesPerSession}
        previous={previousPagesPerSession}
        isLoading={isLoading}
        valueFormatter={(value) => value.toFixed(1)}
      />
      <Stat
        title="Bounce Rate"
        id="bounce_rate"
        value={currentBounceRate}
        previous={previousBounceRate}
        isLoading={isLoading}
        valueFormatter={(value) => `${value.toFixed(1)}%`}
      />
      <Stat
        title="Session Duration"
        id="session_duration"
        value={currentSessionDuration}
        previous={previousSessionDuration}
        isLoading={isLoading}
        valueFormatter={formatSecondsAsMinutesAndSeconds}
      />
    </div>
  );
}
