import { useEffect, useMemo, useRef } from "react";
import { useGetSessionsInfinite } from "../../api/analytics/userSessions";
import { SessionCard, SessionCardSkeleton } from "./SessionCard";

export default function SessionsList({ userId }: { userId?: string }) {
  // Get sessions data with infinite loading
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSessionsInfinite(userId);

  // Combine all pages of data
  const flattenedData = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data || []);
  }, [data]);

  // Reference for the scroll container
  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { scrollHeight, scrollTop, clientHeight } = containerRef.current;

      // Load more when user scrolls to bottom (with a 200px buffer)
      if (
        scrollHeight - scrollTop - clientHeight < 200 &&
        !isFetchingNextPage &&
        hasNextPage
      ) {
        fetchNextPage();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (error)
    return (
      <div className="text-red-500 p-4">Error: {(error as Error).message}</div>
    );

  return (
    <div ref={containerRef} className="overflow-auto pr-2">
      {isLoading ? (
        // Show skeleton cards while loading
        <SessionCardSkeleton />
      ) : flattenedData.length === 0 ? (
        <div className="flex justify-center py-8 text-gray-400">
          No sessions found
        </div>
      ) : (
        // Render session cards with more robust key generation
        flattenedData.map((session, index) => (
          <SessionCard
            key={`${session.session_id}-${index}`}
            session={session}
            userId={userId}
          />
        ))
      )}

      {isFetchingNextPage && (
        <div className="">
          <SessionCardSkeleton key="loading-more" />
        </div>
      )}
    </div>
  );
}
