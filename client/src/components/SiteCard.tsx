import Link from "next/link";
import { SiteSettings } from "./SiteSettings/SiteSettings";
import { SiteSessionChart } from "./SiteSessionChart";
import { Activity, Users } from "lucide-react";
import { useGetOverviewBucketed } from "@/hooks/api";
import { Skeleton } from "./ui/skeleton";

interface SiteCardProps {
  siteId: number;
  domain: string;
}

export function SiteCard({ siteId, domain }: SiteCardProps) {
  const { data, isLoading } = useGetOverviewBucketed({
    past24Hours: true,
    site: siteId,
  });

  const totalSessions = data?.data?.reduce(
    (acc, curr) => acc + curr.sessions,
    0
  );

  const totalUsers = data?.data?.reduce((acc, curr) => acc + curr.users, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col rounded-lg bg-neutral-900 p-4" key={siteId}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2 items-center">
            <img
              className="w-6 mr-1"
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=48`}
              alt={domain}
            />
            <span className="text-lg font-semibold truncate">{domain}</span>
          </div>
        </div>
        <Skeleton className="h-[100px] w-full bg-neutral-950 mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 bg-neutral-800" />
          <Skeleton className="h-12 bg-neutral-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg bg-neutral-900 p-4">
      <div className="flex justify-between items-center mb-3">
        <Link href={`/${siteId}`} className="hover:underline">
          <div className="flex gap-2 items-center">
            <img
              className="w-6 mr-1"
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=48`}
              alt={domain}
            />
            <span className="text-lg font-semibold truncate">{domain}</span>
          </div>
        </Link>
        <SiteSettings siteId={siteId} />
      </div>

      <div className="mt-2">
        <SiteSessionChart data={data?.data ?? []} height={100} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-blue-400" />
          <div>
            <div className="text-gray-400">Sessions</div>
            <div className="font-semibold">
              {totalSessions?.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-green-400" />
          <div>
            <div className="text-gray-400">Users</div>
            <div className="font-semibold">{totalUsers?.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
