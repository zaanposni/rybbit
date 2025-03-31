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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  changeSiteDomain,
  deleteSite,
  GetSitesResponse,
  useGetSiteMetadata,
  useGetSites,
} from "@/api/admin/sites";
import { BACKEND_URL } from "@/lib/const";

export function SiteSettings() {
  const { siteMetadata } = useGetSiteMetadata();

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

  // Script configuration options
  const [debounceValue, setDebounceValue] = useState(500);
  const [autoTrack, setAutoTrack] = useState(true);

  // Generate tracking script dynamically based on options
  const trackingScript = `<script
    src="${BACKEND_URL}/script.js"
    data-site-id="${siteMetadata.siteId}"${
    debounceValue !== 500
      ? `
    data-debounce="${debounceValue}"`
      : ""
  }${
    !autoTrack
      ? `
    data-auto-track="false"`
      : ""
  }
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
          <DialogDescription>
            Manage settings for {siteMetadata.domain}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Tracking Script
              </h4>
              <p className="text-xs text-muted-foreground">
                Add this script to the <code>&lt;head&gt;</code> of your website
              </p>
            </div>
            <CodeSnippet language="HTML" code={trackingScript} />
            {/* Script Options Section */}
            <div className="space-y-3 pl-4">
              <h4 className="text-sm font-semibold text-foreground">
                Script Options
              </h4>
              <div className="space-y-2">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="debounce"
                    className="text-sm font-medium text-foreground"
                  >
                    Debounce Duration (ms)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="debounce"
                      type="number"
                      min="0"
                      max="5000"
                      value={debounceValue}
                      onChange={(e) =>
                        setDebounceValue(parseInt(e.target.value) || 0)
                      }
                      className="max-w-[120px]"
                    />
                    <span className="text-xs text-muted-foreground">
                      Default: 500ms
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Time to wait before tracking a pageview after URL changes
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="autoTrack"
                      className="text-sm font-medium text-foreground block"
                    >
                      Automatically track URL changes
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      For SPAs: track page views when URL changes (using History
                      API)
                    </p>
                  </div>
                  <Switch
                    id="autoTrack"
                    checked={autoTrack}
                    onCheckedChange={setAutoTrack}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Domain Settings Section */}
          <div className="space-y-3 pt-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Change Domain
              </h4>
              <p className="text-xs text-muted-foreground">
                Update the domain for this site
              </p>
            </div>
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

          {/* Danger Zone Section */}
          <div className="space-y-3 pt-3">
            <h4 className="text-sm font-semibold text-destructive">
              Danger Zone
            </h4>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
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
