import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { GetSessionsResponse } from "../../../../api/analytics/userSessions";
import { SessionCard, SessionCardSkeleton } from "./SessionCard";

interface SessionsListProps {
  data: GetSessionsResponse;
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
}

export default function SessionsList({
  data,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: SessionsListProps) {
  const { site } = useParams();
  const router = useRouter();

  // Reference for the scroll container
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle navigation to user details page
  const handleSessionClick = (userId: string) => {
    router.push(`/${site}/user/${userId}`);
  };

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

  return (
    <div
      ref={containerRef}
      className="overflow-auto pr-2"
      style={{ height: "calc(100vh - 200px)" }}
    >
      {isLoading ? (
        // Show skeleton cards while loading
        Array.from({ length: 10 }).map((_, index) => (
          <SessionCardSkeleton key={`skeleton-${index}`} />
        ))
      ) : data.length === 0 ? (
        <div className="flex justify-center py-8 text-gray-400">
          No sessions found
        </div>
      ) : (
        // Render session cards with more robust key generation
        data.map((session, index) => (
          <SessionCard
            key={`${index}`}
            session={session}
            onClick={() => handleSessionClick(session.user_id)}
          />
        ))
      )}

      {isFetchingNextPage && (
        <div className="py-4">
          <SessionCardSkeleton key="loading-more" />
        </div>
      )}
    </div>
  );
}
