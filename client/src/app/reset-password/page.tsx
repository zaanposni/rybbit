"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSetPageTitle } from "../../hooks/useSetPageTitle";
import { authClient } from "../../lib/auth";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthError } from "@/components/auth/AuthError";

export default function ResetPasswordPage() {
  useSetPageTitle("Rybbit · Reset Password");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });

      if (error) {
        setError(error.message);
      } else {
        setOtpSent(true);
      }
    } catch (error) {
      setError(String(error));
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simple validation for password length
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long");
        setIsLoading(false);
        return;
      }

      const { data, error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        setResetSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      setError(String(error));
    }

    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen w-full p-4">
      <Card className="w-full max-w-sm p-1">
        <CardHeader>
          <Image src="/rybbit.png" alt="Rybbit" width={32} height={32} />
          <CardTitle className="text-2xl flex justify-center">
            {resetSuccess
              ? "Password Reset Successful"
              : otpSent
              ? "Enter OTP Code"
              : "Reset Password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resetSuccess ? (
            <div className="text-center space-y-4">
              <p className="text-green-500">
                Your password has been reset successfully!
              </p>
              <p>Redirecting to login page...</p>
            </div>
          ) : otpSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We've sent a verification code to {email}. Please enter the code
                below along with your new password.
              </p>

              <AuthInput
                id="otp"
                label="Verification Code"
                type="text"
                placeholder="000000"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <AuthInput
                id="new-password"
                label="New Password"
                type="password"
                placeholder="••••••••"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <AuthButton
                isLoading={isLoading}
                loadingText="Resetting password..."
              >
                Reset Password
              </AuthButton>

              <AuthError error={error} title="Error Resetting Password" />

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Use a different email
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a verification code
                to reset your password.
              </p>

              <AuthInput
                id="email"
                label="Email"
                type="email"
                placeholder="example@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <AuthButton isLoading={isLoading} loadingText="Sending code...">
                Send Verification Code
              </AuthButton>

              <AuthError error={error} title="Error Sending Code" />

              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
