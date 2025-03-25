"use client";

import { useMemo } from "react";
import { SubHeader } from "../components/SubHeader/SubHeader";
import { useGetSessionsInfinite } from "../../../api/analytics/userSessions";
import SessionsList from "./components/SessionsList";

export default function SessionsPage() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSessionsInfinite();

  // Combine all pages of data
  const flattenedData = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data || []);
  }, [data]);

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div>
      <SubHeader />
      <SessionsList
        data={flattenedData}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
