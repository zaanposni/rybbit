"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/api";
import { AlertCircle, ArrowRight } from "lucide-react";
import { authClient } from "../../../lib/auth";
import { CurrentPlanCard } from "./components/CurrentPlanCard";
import { PlanFeaturesCard } from "./components/PlanFeaturesCard";
import { ChangePlanDialog } from "./components/ChangePlanDialog";
import { ErrorDialog } from "./components/ErrorDialog";
import { HelpSection } from "./components/HelpSection";
import { getPlanDetails } from "./utils/planUtils";
import { DEFAULT_EVENT_LIMIT, DEFAULT_USAGE } from "./utils/constants";
import { STRIPE_PRICES } from "@/lib/stripe";

export default function SubscriptionPage() {
  const router = useRouter();

  const {
    data: activeSubscription,
    isLoading,
    error: subscriptionError,
    refetch,
  } = useSubscription();

  // State variables
  const [errorType, setErrorType] = useState<"cancel" | "resume">("cancel");
  const [showConfigError, setShowConfigError] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Current usage - in a real app, you would fetch this from your API
  const currentUsage = DEFAULT_USAGE;

  const handleCancelSubscription = async () => {
    try {
      setIsProcessing(true);
      setErrorType("cancel");
      setActionError(null);

      // Don't pass referenceId if it's the same as the user ID
      // This is because Better Auth defaults to the user ID when no referenceId is provided
      const { error } = await authClient.subscription.cancel({
        returnUrl: window.location.href,
      });

      if (error) {
        // Check for specific error about Stripe portal configuration
        if (
          error.message?.includes("No configuration provided") ||
          error.message?.includes("default configuration has not been created")
        ) {
          // Show the error dialog instead of an alert
          setShowConfigError(true);

          // Log detailed instructions for developers/admins
          console.error(
            "Stripe Customer Portal not configured. Admin needs to set up the Customer Portal at https://dashboard.stripe.com/test/settings/billing/portal"
          );
        } else {
          setActionError(
            error.message ||
              "An error occurred while canceling the subscription"
          );
        }
      }
      // The user will be redirected to Stripe's billing portal if successful
    } catch (err: any) {
      console.error("Failed to cancel subscription:", err);
      setActionError(err.message || "Failed to cancel subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeSubscription = async (planId: string) => {
    try {
      setIsProcessing(true);
      setActionError(null);

      // Don't pass referenceId if it's the same as the user ID
      // Better Auth defaults to the user ID when no referenceId is provided
      const { error } = await authClient.subscription.upgrade({
        plan: planId,
        successUrl: "/settings",
        cancelUrl: "/settings",
      });

      if (error) {
        setActionError(
          error.message || "An error occurred while changing the plan"
        );
      }
      // The user will be redirected to Stripe checkout if successful
    } catch (err: any) {
      console.error("Failed to change plan:", err);
      setActionError(err.message || "Failed to change plan");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setIsProcessing(true);
      setErrorType("resume");
      setActionError(null);

      // Check if we have the plan information
      if (!activeSubscription?.plan) {
        setActionError(
          "Cannot resume subscription: plan information is missing"
        );
        setShowConfigError(true);
        return;
      }

      // Directly use the upgrade method to take the user to Stripe checkout
      // with the same plan they currently have
      const { error } = await authClient.subscription.upgrade({
        plan: activeSubscription.plan,
        successUrl: window.location.origin + "/settings",
        cancelUrl: window.location.origin + "/settings",
      });

      if (error) {
        setActionError(
          error.message || "An error occurred while resuming the subscription"
        );
        setShowConfigError(true);
      }
      // The user will be redirected to Stripe checkout if successful
    } catch (err: any) {
      console.error("Failed to resume subscription:", err);
      setActionError(err.message || "Failed to resume subscription");
      setShowConfigError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowUpgradeOptions = () => {
    setShowUpgradeDialog(true);
    setActionError(null);
  };

  // Get information about current plan if there's an active subscription
  const currentPlan = activeSubscription
    ? getPlanDetails(activeSubscription.plan)
    : null;

  // Find the next tier plans for upgrade options
  const getCurrentTierPrices = () => {
    if (!activeSubscription?.plan) return [];

    // Return all available plans for switching
    return STRIPE_PRICES.sort((a, b) => {
      // First sort by plan type (basic first, then pro)
      if (a.name.startsWith("basic") && b.name.startsWith("pro")) return -1;
      if (a.name.startsWith("pro") && b.name.startsWith("basic")) return 1;

      // Then sort by event limit
      return a.limits.events - b.limits.events;
    });
  };

  const upgradePlans = getCurrentTierPrices();

  const errorMessage = subscriptionError?.message || actionError || null;

  // Get event limit from the subscription plan
  const getEventLimit = () => {
    if (!activeSubscription?.plan) return DEFAULT_EVENT_LIMIT;

    const plan = STRIPE_PRICES.find((p) => p.name === activeSubscription.plan);
    return plan?.limits.events || DEFAULT_EVENT_LIMIT;
  };

  const eventLimit = getEventLimit();
  const usagePercentage = (currentUsage.events / eventLimit) * 100;

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your subscription and billing information
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/subscribe")}>
          View Plans
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-20 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      ) : errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : !activeSubscription ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                You don't have an active subscription. Choose a plan to get
                started.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/subscribe")}>
                View Plans <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan */}
          <CurrentPlanCard
            activeSubscription={activeSubscription}
            currentPlan={currentPlan}
            currentUsage={currentUsage}
            eventLimit={eventLimit}
            usagePercentage={usagePercentage}
            isProcessing={isProcessing}
            handleCancelSubscription={handleCancelSubscription}
            handleResumeSubscription={handleResumeSubscription}
            handleShowUpgradeOptions={handleShowUpgradeOptions}
            upgradePlans={upgradePlans}
          />

          {/* Plan Features */}
          <PlanFeaturesCard currentPlan={currentPlan} />
        </div>
      )}

      {/* Help section */}
      <HelpSection router={router} />

      {/* Error dialog */}
      <ErrorDialog
        showConfigError={showConfigError}
        setShowConfigError={setShowConfigError}
        errorType={errorType}
        router={router}
      />

      {/* Change plan dialog */}
      <ChangePlanDialog
        showUpgradeDialog={showUpgradeDialog}
        setShowUpgradeDialog={setShowUpgradeDialog}
        actionError={actionError}
        upgradePlans={upgradePlans}
        activeSubscription={activeSubscription}
        isProcessing={isProcessing}
        handleUpgradeSubscription={handleUpgradeSubscription}
        router={router}
      />
    </div>
  );
}
