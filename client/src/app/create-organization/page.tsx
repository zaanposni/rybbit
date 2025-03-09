"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "../../lib/auth";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string>("");

  // Generate slug from name when name changes
  const handleNameChange = (value: string) => {
    setName(value);
    if (value) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setSlug(generatedSlug);
    }
  };

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      // Create organization
      const { data, error } = await authClient.organization.create({
        name,
        slug,
      });

      if (error) {
        throw new Error(error.message || "Failed to create organization");
      }

      if (!data?.id) {
        throw new Error("No organization ID returned");
      }

      // Set as active organization
      await authClient.organization.setActive({
        organizationId: data.id,
      });

      return data;
    },
    onSuccess: () => {
      toast.success("Organization created successfully");
      router.push("/");
    },
    onError: (error: Error) => {
      setError(error.message);
      toast.error("Failed to create organization");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      setError("Organization name and slug are required");
      return;
    }

    setError("");
    createOrgMutation.mutate({ name, slug });
  };

  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Organization</CardTitle>
          <CardDescription>
            Set up your organization to get started with Frogstats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Acme Inc."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Organization Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="acme-inc"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in your URL: frogstats.io/{slug}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createOrgMutation.isPending || !name || !slug}
              >
                {createOrgMutation.isPending
                  ? "Creating..."
                  : "Create Organization"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
