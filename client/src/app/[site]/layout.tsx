"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "../../lib/store";
import { useSyncStateWithUrl } from "../../lib/urlParams";
import { Header } from "./Header/Header";
import { useSiteHasData } from "../../hooks/api";
import { useGetSiteMetadata } from "../../hooks/hooks";
import { NoData } from "./components/NoData";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setSite, site } = useStore();
  const { data: siteHasData, isLoading } = useSiteHasData(site);
  const { siteMetadata, isLoading: isLoadingSiteMetadata } =
    useGetSiteMetadata(site);

  // Sync store state with URL parameters
  useSyncStateWithUrl();

  useEffect(() => {
    if (pathname.includes("/")) {
      setSite(pathname.split("/")[1]);
    }
  }, [pathname]);

  if (!site) {
    return null;
  }

  if (isLoadingSiteMetadata || isLoading || !siteMetadata) {
    return null;
  }

  if (!siteHasData?.data && !isLoading && !isLoadingSiteMetadata) {
    return <NoData siteMetadata={siteMetadata} />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
}
