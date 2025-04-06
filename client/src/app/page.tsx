"use client";

import { Building, Plus } from "lucide-react";
import { useState } from "react";
import { useGetSites } from "../api/admin/sites";
import { SiteCard } from "../components/SiteCard";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { authClient } from "../lib/auth";
import { AddSite } from "./components/AddSite";
import { CreateOrganizationDialog } from "./components/CreateOrganizationDialog";
import { StandardPage } from "../components/StandardPage";

export default function Home() {
  const {
    data: sites,
    refetch: refetchSites,
    isLoading: isLoadingSites,
  } = useGetSites();
  const userOrganizations = authClient.useListOrganizations();
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);

  // Check if the user has no organizations and is not in a loading state
  const hasNoOrganizations =
    !userOrganizations.isPending &&
    Array.isArray(userOrganizations.data) &&
    userOrganizations.data.length === 0;

  // Handle successful organization creation
  const handleOrganizationCreated = () => {
    userOrganizations.refetch();
    refetchSites();
  };

  return (
    <StandardPage>
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold">Websites</div>
        <AddSite disabled={hasNoOrganizations} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Organization required message */}
        {hasNoOrganizations && (
          <Card className="col-span-full p-6 flex flex-col items-center text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mb-2 text-xl">
              Organization Required
            </CardTitle>
            <CardDescription className="mb-6">
              You need to create an organization before you add a website
            </CardDescription>
            <Button
              onClick={() => setCreateOrgDialogOpen(true)}
              className="max-w-xs"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create an Organization
            </Button>
          </Card>
        )}

        {/* Sites list */}
        {!hasNoOrganizations &&
          sites?.map((site) => {
            return (
              <SiteCard
                key={site.siteId}
                siteId={site.siteId}
                domain={site.domain}
              />
            );
          })}

        {/* No websites message */}
        {!hasNoOrganizations &&
          (!sites || sites.length === 0) &&
          !userOrganizations.isPending &&
          !isLoadingSites && (
            <Card className="col-span-full p-6 flex flex-col items-center text-center">
              <CardTitle className="mb-2 text-xl">No websites yet</CardTitle>
              <CardDescription className="mb-4">
                Add your first website to start tracking analytics
              </CardDescription>
              <AddSite
                trigger={
                  <Button variant="success">
                    <Plus className="h-4 w-4" />
                    Add Website
                  </Button>
                }
              />
            </Card>
          )}
      </div>

      <CreateOrganizationDialog
        open={createOrgDialogOpen}
        onOpenChange={setCreateOrgDialogOpen}
        onSuccess={handleOrganizationCreated}
      />
    </StandardPage>
  );
}
