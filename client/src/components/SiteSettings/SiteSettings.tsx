"use client";

import { AlertTriangle, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CodeSnippet } from "@/components/CodeSnippet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import {
  changeSiteDomain,
  deleteSite,
  GetSitesResponse,
  useGetSites,
} from "@/hooks/api";
import { BACKEND_URL } from "@/lib/const";
import { useGetSiteMetadata } from "../../hooks/hooks";

interface SiteSettingsProps {
  siteId: number;
}

export function SiteSettings({ siteId }: SiteSettingsProps) {
  const { siteMetadata } = useGetSiteMetadata(siteId);

  if (!siteMetadata) {
    return null;
  }

  return <SiteSettingsInner siteMetadata={siteMetadata} />;
}

export function SiteSettingsInner({
  siteMetadata,
}: {
  siteMetadata: GetSitesResponse[number];
}) {
  const { refetch } = useGetSites();
  const router = useRouter();
  const [newDomain, setNewDomain] = useState(siteMetadata.domain);
  const [isChangingDomain, setIsChangingDomain] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const trackingScript = `<script
    src="${BACKEND_URL}/script.js"
    site-id="${siteMetadata.siteId}"
    defer
/>`;

  const handleDomainChange = async () => {
    if (!newDomain) {
      toast.error("Domain cannot be empty");
      return;
    }

    try {
      setIsChangingDomain(true);
      await changeSiteDomain(siteMetadata.siteId, newDomain);
      toast.success("Domain updated successfully");
      router.refresh();
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error changing domain:", error);
      toast.error("Failed to update domain");
    } finally {
      setIsChangingDomain(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSite(siteMetadata.siteId);
      toast.success("Site deleted successfully");
      router.push("/");
      setDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error deleting site:", error);
      toast.error("Failed to delete site");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!siteMetadata) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
          <DialogDescription>
            Manage settings for {siteMetadata.domain}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Tracking Script</h4>
            <p className="text-xs text-neutral-500">
              Add this script to the <code>&lt;head&gt;</code> of your website
            </p>
            <CodeSnippet language="HTML" code={trackingScript} />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Change Domain</h4>
            <p className="text-xs text-neutral-500">
              Update the domain for this site
            </p>
            <div className="flex space-x-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
              />
              <Button
                variant="outline"
                onClick={handleDomainChange}
                disabled={isChangingDomain || newDomain === siteMetadata.domain}
              >
                {isChangingDomain ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-500">Danger Zone</h4>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4" />
                  Delete Site
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the site &quot;{siteMetadata.name}&quot; and all of its
                    analytics data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="destructive"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete site"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
