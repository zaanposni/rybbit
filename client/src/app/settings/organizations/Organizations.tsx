"use client";
import { DateTime } from "luxon";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useOrganizationMembers } from "../../../hooks/api";
import { authClient } from "../../../lib/auth";

// Import the separated dialog components
import { DeleteOrganizationDialog } from "./DeleteOrganizationDialog";
import { EditOrganizationDialog } from "./EditOrganizationDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { InviteMemberDialog } from "./InviteMemberDialog";

// Types for our component
export type Organization = {
  id: string;
  name: string;
  createdAt: string;
  slug: string;
};

export type Member = {
  id: string;
  role: string;
  userId: string;
  organizationId: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

// Organization Component with Members Table
function Organization({ org }: { org: Organization }) {
  const { data: members, refetch } = useOrganizationMembers(org.id);

  const { data } = authClient.useSession();

  const isOwner = members?.data.find(
    (member) => member.role === "owner" && member.userId === data?.user?.id
  );

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {org.name}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({org.slug})
            </span>
          </CardTitle>

          <div className="flex items-center">
            {isOwner && (
              <>
                <InviteMemberDialog
                  organizationId={org.id}
                  onSuccess={handleRefresh}
                />
                <EditOrganizationDialog
                  organization={org}
                  onSuccess={handleRefresh}
                />
                <DeleteOrganizationDialog
                  organization={org}
                  onSuccess={handleRefresh}
                />
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {isOwner && <TableHead className="w-12">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.data?.map((member: any) => (
              <TableRow key={member.id}>
                <TableCell>{member.user?.name || "—"}</TableCell>
                <TableCell>{member.user?.email}</TableCell>
                <TableCell className="capitalize">{member.role}</TableCell>
                <TableCell>
                  {DateTime.fromISO(member.createdAt).toLocaleString(
                    DateTime.DATE_SHORT
                  )}
                </TableCell>
                {isOwner && (
                  <TableCell className="text-right">
                    {member.role !== "owner" && (
                      <RemoveMemberDialog
                        member={member}
                        organizationId={org.id}
                        onSuccess={handleRefresh}
                      />
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {(!members?.data || members.data.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={isOwner ? 5 : 4}
                  className="text-center py-6 text-muted-foreground"
                >
                  No members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// OrganizationsInner component
function OrganizationsInner({
  organizations,
}: {
  organizations: Organization[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {organizations?.map((organization) => (
        <Organization key={organization.id} org={organization} />
      ))}
      {organizations.length === 0 && (
        <Card className="p-6 text-center text-muted-foreground">
          You don't have any organizations yet.
        </Card>
      )}
    </div>
  );
}

// Main Organizations component
export function Organizations() {
  const userOrganizations = authClient.useListOrganizations();

  if (userOrganizations.isPending) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse">Loading organizations...</div>
      </div>
    );
  }

  if (!userOrganizations.data) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No organizations found
      </Card>
    );
  }

  return <OrganizationsInner organizations={userOrganizations.data as any} />;
}
