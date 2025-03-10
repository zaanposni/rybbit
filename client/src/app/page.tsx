"use client";

import { useState, useEffect } from "react";
import { SiteCard } from "../components/SiteCard";
import { useGetSites } from "../hooks/api";
import { authClient } from "../lib/auth";
import { AddSite } from "./components/AddSite";
import { CreateOrganizationDialog } from "./components/CreateOrganizationDialog";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Plus, Building } from "lucide-react";

export default function Home() {
  const { data: sites, refetch: refetchSites } = useGetSites();
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

  // If the user has no organizations, show a welcome message with the option to create one
  if (hasNoOrganizations) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Frogstats</CardTitle>
            <CardDescription>
              You need to create an organization to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-muted-foreground text-center mb-6">
              Organizations help you organize your websites and collaborate with
              your team.
            </p>
            <Button
              onClick={() => setCreateOrgDialogOpen(true)}
              className="w-full max-w-xs"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create an Organization
            </Button>
          </CardContent>
        </Card>

        <CreateOrganizationDialog
          open={createOrgDialogOpen}
          onOpenChange={setCreateOrgDialogOpen}
          onSuccess={handleOrganizationCreated}
        />
      </div>
    );
  }

  // Otherwise, show the normal dashboard with sites
  return (
    <div className="flex min-h-screen flex-col pt-1">
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold">Websites</div>
        <AddSite />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites?.data?.map((site) => {
          return (
            <SiteCard
              key={site.siteId}
              siteId={site.siteId}
              domain={site.domain}
            />
          );
        })}
        {(!sites?.data || sites.data.length === 0) &&
          !userOrganizations.isPending && (
            <Card className="col-span-full p-6 flex flex-col items-center text-center">
              <CardTitle className="mb-2 text-xl">No websites yet</CardTitle>
              <CardDescription>
                Add your first website to start tracking analytics
              </CardDescription>
            </Card>
          )}
      </div>
    </div>
  );
}
