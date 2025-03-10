"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { useState, useEffect } from "react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { addSite, useGetSites } from "../../hooks/api";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { AlertCircle, AppWindow, Building2 } from "lucide-react";
import { authClient } from "../../lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

/**
 * A simple domain validation function:
 * - Ensures at least one dot separator
 * - Allows subdomains (e.g. sub.example.com)
 * - Requires the TLD to be alphabetical (e.g. .com)
 */
function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

export function AddSite() {
  const { data: sites, refetch } = useGetSites();
  const { data: organizations } = authClient.useListOrganizations();

  const existingSites = sites?.data?.map((site) => site.domain);

  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>("");
  const [error, setError] = useState("");

  // Set the first organization as the default selection when organizations are loaded
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrganizationId) {
      setSelectedOrganizationId(organizations[0].id);
    }
  }, [organizations, selectedOrganizationId]);

  const domainMatchesExistingSites = existingSites?.includes(domain);

  const handleSubmit = async () => {
    setError("");

    if (!selectedOrganizationId) {
      setError("Please select an organization");
      return;
    }

    // Validate before attempting to add
    if (!isValidDomain(domain)) {
      setError(
        "Invalid domain format. Must be a valid domain like example.com or sub.example.com"
      );
      return;
    }

    const response = await addSite(domain, domain, selectedOrganizationId);
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.error || "Failed to add site");
      return;
    }
    setOpen(false);
    refetch();
  };

  return (
    <div>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          setDomain("");
          setError("");
          // Reset organization to first one when opening dialog
          if (isOpen && organizations && organizations.length > 0) {
            setSelectedOrganizationId(organizations[0].id);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button>Add Website</Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AppWindow className="h-6 w-6" />
              Add Website
            </DialogTitle>
            <DialogDescription>
              Track analytics for a new website in your organization
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com or sub.example.com"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="organization">Organization</Label>
              <Select
                value={selectedOrganizationId}
                onValueChange={setSelectedOrganizationId}
                disabled={!organizations || organizations.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        {org.name}
                      </div>
                    </SelectItem>
                  ))}
                  {(!organizations || organizations.length === 0) && (
                    <SelectItem value="no-org" disabled>
                      No organizations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Adding Website</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={"success"}
              onClick={handleSubmit}
              disabled={
                !domain || domainMatchesExistingSites || !selectedOrganizationId
              }
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
