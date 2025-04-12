"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "../../lib/store";
import { useSyncStateWithUrl } from "../../lib/urlParams";
import { Header } from "./components/Header/Header";
import { useSiteHasData, useGetSite } from "../../api/admin/sites";
import { NoData } from "./components/NoData";
import { TopBar } from "../../components/TopBar";
import { Sidebar } from "./components/Sidebar/Sidebar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setSite, site } = useStore();
  const { data: siteHasData, isLoading } = useSiteHasData(site);

  const { data: siteMetadata, isLoading: isLoadingSiteMetadata } =
    useGetSite(site);

  // Sync store state with URL parameters
  useSyncStateWithUrl();

  useEffect(() => {
    if (pathname.includes("/") && pathname.split("/")[1] !== site) {
      setSite(pathname.split("/")[1]);
    }
  }, [pathname]);

  if (!site) {
    return null;
  }

  if (isLoadingSiteMetadata || isLoading || !siteMetadata) {
    return null;
  }

  if (!siteHasData && !isLoading && !isLoadingSiteMetadata) {
    return <NoData siteMetadata={siteMetadata} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div>
            {/* <div className="px-4 py-2 max-w-[1400px] mx-auto w-full mb-4"> */}
            <Header />
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
