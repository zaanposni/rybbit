import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { authClient } from "../../../lib/auth";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../../components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";

export function AddUser() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [error, setError] = useState("");

  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }
    try {
      const response = await authClient.admin.createUser({
        password,
        email,
        name,
        role: isAdmin ? "admin" : "user",
      });

      if (response.error) {
        setError(String(response.error.message));
        return;
      }

      setOpen(false);
    } catch (error) {
      setError(String(error));
    }
  };

  return (
    <div>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          setPassword("");
          setConfirmPassword("");
          setName("");
          setEmail("");
          setError("");
          setIsAdmin(false);
        }}
      >
        <DialogTrigger asChild>
          <Button>Add User</Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is-admin"
              checked={isAdmin}
              onCheckedChange={() => setIsAdmin(!isAdmin)}
            />
            <Label htmlFor="is-admin">Admin</Label>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="password"> Password</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Creating User</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => setOpen(false)}
              variant={"ghost"}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={
                !password || !confirmPassword || !passwordsMatch || !name
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
