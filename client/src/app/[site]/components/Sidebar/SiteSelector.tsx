import { Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useGetSite, useGetSites } from "../../../../api/admin/sites";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { userStore } from "../../../../lib/userStore";

function SiteSelectorContent() {
  const { data: sites } = useGetSites();
  const pathname = usePathname();
  const router = useRouter();
  const currentSiteId = Number(pathname.split("/")[1]);

  return (
    <DropdownMenuContent align="start">
      {sites?.map((site) => {
        const isSelected = site.siteId === currentSiteId;
        return (
          <DropdownMenuItem
            key={site.siteId}
            onClick={() => {
              router.push(`/${site.siteId}`);
            }}
            className={`flex items-center justify-between ${
              isSelected ? "bg-neutral-800" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <img
                className="w-4 h-4"
                src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`}
                alt={site.domain}
              />
              <span>{site.domain}</span>
            </div>
            {isSelected && <Check size={16} />}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuContent>
  );
}

export function SiteSelector() {
  const pathname = usePathname();

  const { user } = userStore();
  const currentSiteId = Number(pathname.split("/")[1]);
  const { data: site } = useGetSite(currentSiteId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger unstyled>
        {site && (
          <div className="flex gap-2 border border-neutral-800 rounded-lg py-1.5 px-3 justify-start cursor-pointer hover:bg-neutral-800/50 transition-colors h-[36px]">
            <img
              className="w-5 h-5"
              src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`}
              alt={site.domain}
            />
            <div className="text-white truncate text-sm">{site.domain}</div>
          </div>
        )}
      </DropdownMenuTrigger>
      {user && <SiteSelectorContent />}
    </DropdownMenu>
  );
}
