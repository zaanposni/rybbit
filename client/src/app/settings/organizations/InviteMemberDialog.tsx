"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Dialog } from "../../../components/ui/dialog";
import { DialogContent } from "../../../components/ui/dialog";
import { DialogHeader } from "../../../components/ui/dialog";
import { DialogTitle } from "../../../components/ui/dialog";
import { DialogTrigger } from "../../../components/ui/dialog";
import { DialogFooter } from "../../../components/ui/dialog";
import { DialogDescription } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { SelectContent } from "../../../components/ui/select";
import { SelectItem } from "../../../components/ui/select";
import { SelectTrigger } from "../../../components/ui/select";
import { SelectValue } from "../../../components/ui/select";
import { UserPlus } from "lucide-react";
import { authClient } from "../../../lib/auth";
import { toast } from "sonner";

interface InviteMemberDialogProps {
  organizationId: string;
  onSuccess: () => void;
}

export function InviteMemberDialog({
  organizationId,
  onSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleInvite = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.organization.inviteMember({
        email,
        role: role as "admin" | "member" | "owner",
        organizationId,
      });

      toast.success(`Invitation sent to ${email}`);
      setOpen(false);
      onSuccess();
      setEmail("");
      setRole("member");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="ml-2">
          <UserPlus className="h-4 w-4 mr-1" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a new member</DialogTitle>
          <DialogDescription>
            Send an invitation to add someone to this organization.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isLoading} variant="success">
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
