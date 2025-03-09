"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "../../lib/auth";
import { userStore } from "../../lib/userStore";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import Link from "next/link";
import { IS_CLOUD } from "../../lib/const";
import { capitalize } from "lodash";

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setError("");
    try {
      if (IS_CLOUD) {
        const { data, error } = await authClient.signIn.email({
          email: username,
          password,
        });
        if (data?.user) {
          userStore.setState({
            user: data.user,
          });
          router.push("/");
        }

        if (error) {
          setError(error.message);
        }
      } else {
        const { data, error } = await authClient.signIn.username({
          username,
          password,
        });
        if (data?.user) {
          userStore.setState({
            user: data.user,
          });
          router.push("/");
        }

        if (error) {
          setError(error.message);
        }
      }
    } catch (error) {
      setError(String(error));
    }
    setIsLoading(false);
  };

  const handleSocialSignIn = async (
    provider: "google" | "github" | "twitter"
  ) => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch (error) {
      setError(String(error));
    }
  };

  const label = IS_CLOUD ? "email" : "username";

  return (
    <div className="flex justify-center items-center h-screen w-full">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl flex justify-center">
            Welcome back!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor={label}>{capitalize(label)}</Label>
                <Input
                  id={label}
                  type={label}
                  placeholder={label}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              {IS_CLOUD && (
                <>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialSignIn("google")}
                    >
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialSignIn("github")}
                    >
                      GitHub
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialSignIn("twitter")}
                    >
                      X (Twitter)
                    </Button>
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Logging In</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {IS_CLOUD && (
                <div className="text-center text-sm">
                  Don't have an account?{" "}
                  <Link href="/signup" className="underline">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
