"use client";
import { usePathname } from "next/navigation";
import { useGetSites } from "../../../../api/admin/sites";
import { UsageBanners } from "./UsageBanners";

export function Header() {
  const { data: sites } = useGetSites();
  const pathname = usePathname();

  const site = sites?.find(
    (site) => site.siteId === Number(pathname.split("/")[1])
  );

  return (
    <div className="flex flex-col">{/* <UsageBanners site={site} /> */}</div>
  );
}
