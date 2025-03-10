import { useState } from "react";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { Button } from "../../../components/ui/button";
import { UserWithRole } from "better-auth/plugins/admin";
import { authClient } from "../../../lib/auth";

export function DeleteUser({
  user,
  refetch,
}: {
  user: UserWithRole;
  refetch: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ConfirmationModal
      title="Delete User"
      description="Are you sure you want to delete this user?"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onConfirm={async () => {
        await authClient.admin.removeUser({ userId: user.id });
        refetch();
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
