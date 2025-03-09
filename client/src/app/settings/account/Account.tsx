import { authClient } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { ChangePassword } from "./ChangePassword";
import { DeleteAccount } from "./DeleteAccount";
import { IS_CLOUD } from "../../../lib/const";

export function Account({
  session,
}: {
  session: ReturnType<typeof authClient.useSession>;
}) {
  const [username, setUsername] = useState(session.data?.user.username ?? "");
  const [email, setEmail] = useState(session.data?.user.email ?? "");
  const [name, setName] = useState(session.data?.user.name ?? "");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const handleNameUpdate = async () => {
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsUpdatingName(true);
      const response = await authClient.updateUser({
        name,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to update name");
      }

      toast.success("Name updated successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update name"
      );
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!username) {
      toast.error("Username cannot be empty");
      return;
    }

    try {
      setIsUpdatingUsername(true);
      const response = await authClient.updateUser({
        username,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to update username");
      }

      toast.success("Username updated successfully");

      // Reload the page to refresh the session
      window.location.reload();
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update username"
      );
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!email) {
      toast.error("Email cannot be empty");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsUpdatingEmail(true);
      const response = await authClient.changeEmail({
        newEmail: email,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to update email");
      }

      toast.success("Email updated successfully");

      // Reload the page to refresh the session
      window.location.reload();
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update email"
      );
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {IS_CLOUD ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Name</h4>
              <p className="text-xs text-neutral-500">
                Update your name displayed across the platform
              </p>
              <div className="flex space-x-2">
                <Input
                  id="name"
                  value={name}
                  onChange={({ target }) => setName(target.value)}
                  placeholder="name"
                />
                <Button
                  variant="outline"
                  onClick={handleNameUpdate}
                  disabled={isUpdatingName || name === session.data?.user.name}
                >
                  {isUpdatingName ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Username</h4>
              <p className="text-xs text-neutral-500">
                Update your username displayed across the platform
              </p>
              <div className="flex space-x-2">
                <Input
                  id="username"
                  value={username}
                  onChange={({ target }) => setUsername(target.value)}
                  placeholder="username"
                />
                <Button
                  variant="outline"
                  onClick={handleUsernameUpdate}
                  disabled={
                    isUpdatingUsername ||
                    username === session.data?.user.username
                  }
                >
                  {isUpdatingUsername ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Email</h4>
            <p className="text-xs text-neutral-500">
              Update your email address for account notifications
            </p>
            <div className="flex space-x-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={({ target }) => setEmail(target.value)}
                placeholder="email@example.com"
              />
              <Button
                variant="outline"
                onClick={handleEmailUpdate}
                disabled={isUpdatingEmail || email === session.data?.user.email}
              >
                {isUpdatingEmail ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Password</h4>
            <p className="text-xs text-neutral-500">
              Change your account password
            </p>
            <div className="w-[200px]">
              <ChangePassword />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-500">Danger Zone</h4>
            <p className="text-xs text-neutral-500">
              Permanently delete your account and all associated data
            </p>
            <div className="w-[200px]">
              <DeleteAccount />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
