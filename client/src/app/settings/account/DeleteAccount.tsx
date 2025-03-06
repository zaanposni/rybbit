import { useState } from "react";
import { Button } from "../../../components/ui/button";
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
} from "../../../components/ui/alert-dialog";
import { authClient } from "../../../lib/auth";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function DeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      const response = await authClient.deleteUser({});

      if (response.error) {
        toast.error(`Failed to delete account: ${response.error.message}`);
        return;
      }

      toast.success("Account successfully deleted");
      // The user will be redirected to the login page by the auth system
    } catch (error) {
      toast.error(`Failed to delete account: ${error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove all of your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAccountDeletion}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Yes, delete my account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
