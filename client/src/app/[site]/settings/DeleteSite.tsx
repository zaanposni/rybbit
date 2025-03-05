import { useState } from "react";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { Button } from "../../../components/ui/button";
import {
  APIResponse,
  deleteSite,
  GetSitesResponse,
  useGetSites,
} from "../../../hooks/api";
import { useRouter } from "next/navigation";

export function DeleteSite({
  site,
}: {
  site: APIResponse<GetSitesResponse>["data"][number];
}) {
  const { refetch } = useGetSites();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <ConfirmationModal
      title="Delete Site"
      description={`Are you sure you want to delete ${site.domain}? All tracking history will be deleted.`}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onConfirm={async () => {
        await deleteSite(site.siteId);
        refetch();
        router.push("/");
      }}
      primaryAction={{
        variant: "destructive",
        children: "Delete",
      }}
    >
      <Button variant={"destructive"} size={"sm"}>
        Delete
      </Button>
    </ConfirmationModal>
  );
}
