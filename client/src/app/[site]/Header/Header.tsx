"use client";
import { ChartBarDecreasing, ChartLine, Radio, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGetSites } from "../../../api/admin/sites";
import { SiteSettings } from "../../../components/SiteSettings/SiteSettings";
import LiveUserCount from "./LiveUserCount";
import { UsageBanners } from "./UsageBanners";

export function Header() {
  const { data: sites } = useGetSites();
  const pathname = usePathname();

  const site = sites?.find(
    (site) => site.siteId === Number(pathname.split("/")[1])
  );

  // Check which tab is active based on the current path
  const getTabPath = (tabName: string) => {
    return `/${pathname.split("/")[1]}/${tabName.toLowerCase()}`;
  };

  const isActiveTab = (tabName: string) => {
    if (!pathname.includes("/")) return false;

    const route = pathname.split("/")[2] || "main";
    return route === tabName.toLowerCase();
  };

  return (
    <div className="flex flex-col">
      {/* Usage Banners */}
      <UsageBanners site={site} />

      <div className="flex items-center justify-between py-2">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 text-xl font-bold">
            <img
              className="w-7 mr-1"
              src={`https://www.google.com/s2/favicons?domain=${site?.domain}&sz=64`}
            />
            <div>{site?.domain}</div>
          </div>
          <div className="flex items-center gap-1 text-base text-neutral-600 dark:text-neutral-400">
            <LiveUserCount />
            <SiteSettings siteId={site?.siteId ?? 0} />
          </div>
        </div>
        <div className="flex space-x-2">
          <TabButton
            label="Main"
            active={isActiveTab("main")}
            href={getTabPath("main")}
            icon={<ChartLine size={20} />}
          />
          <TabButton
            label="Sessions"
            active={isActiveTab("sessions")}
            href={getTabPath("sessions")}
            icon={<User size={20} />}
          />
          <TabButton
            label="Realtime"
            active={isActiveTab("realtime")}
            href={getTabPath("realtime")}
            icon={<Radio size={20} />}
          />
          <TabButton
            label="Retention"
            active={isActiveTab("retention")}
            href={getTabPath("retention")}
            icon={<ChartBarDecreasing size={20} />}
          />
          <TabButton
            label="Reports"
            active={isActiveTab("reports")}
            href={getTabPath("reports")}
            icon={<ChartBarDecreasing size={20} />}
          />
        </div>
      </div>
    </div>
  );
}

// Tab Button component with navigation
function TabButton({
  label,
  active = false,
  href,
  icon,
}: {
  label: string;
  active?: boolean;
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link href={href} className="focus:outline-none">
      <button
        className={`px-3 py-2 rounded-lg font-sm transition-colors ${
          active
            ? "bg-neutral-800 text-white  hover:bg-neutral-800/75 "
            : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
        }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          {label}
        </div>
      </button>
    </Link>
  );
}
