"use client";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelSubscription,
  useSubscription,
  useUpgradeSubscription,
} from "@/hooks/api";
import { STRIPE_PRICES } from "@/lib/stripe";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "../../../lib/auth";

// Define interfaces for plan data
interface PlanTemplate {
  id: string;
  name: string;
  price: string;
  interval: string;
  description: string;
  features: string[];
  color: string;
  icon: React.ReactNode;
}

// Helper to get the appropriate plan details based on subscription plan name
const getPlanDetails = (planName: string | undefined): PlanTemplate | null => {
  if (!planName) return null;

  const tier = planName.startsWith("basic")
    ? "basic"
    : planName.startsWith("pro")
    ? "pro"
    : "free";
  const stripePlan = STRIPE_PRICES.find((p) => p.name === planName);

  const planTemplates: Record<string, PlanTemplate> = {
    free: {
      id: "free",
      name: "Free",
      price: "$0",
      interval: "month",
      description: "Get started with basic analytics",
      features: [
        "20,000 events per month",
        "Basic analytics",
        "7-day data retention",
        "Community support",
      ],
      color:
        "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
      icon: <Clock className="h-5 w-5" />,
    },
    basic: {
      id: "basic",
      name: "Basic",
      price: "$19+",
      interval: "month",
      description: "Essential analytics for small projects",
      features: [
        "Core analytics features",
        "14-day data retention",
        "Basic support",
      ],
      color:
        "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-800 dark:to-emerald-800",
      icon: <Shield className="h-5 w-5" />,
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: "$39+",
      interval: "month",
      description: "Advanced analytics for growing businesses",
      features: [
        "Advanced dashboard features",
        "30-day data retention",
        "Priority support",
        "Custom event definitions",
        "Team collaboration",
      ],
      color:
        "bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-800 dark:to-teal-800",
      icon: <Zap className="h-5 w-5" />,
    },
  };

  const plan = { ...planTemplates[tier] };

  if (stripePlan) {
    plan.price = `$${stripePlan.price}`;
    plan.interval = stripePlan.interval;

    // Add event limit as first feature
    plan.features = [
      `${stripePlan.limits.events.toLocaleString()} events per month`,
      ...plan.features,
    ];
  }

  return plan;
};

// Helper function to format dates
const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

// Current usage - in a real app, you would fetch this from your API
const DEFAULT_USAGE = {
  events: 45000, // Example value
};

// Default event limit if not specified in subscription
const DEFAULT_EVENT_LIMIT = 100000;

export default function SubscriptionPage() {
  const router = useRouter();

  const {
    data: activeSubscription,
    isLoading,
    error: subscriptionError,
    refetch,
  } = useSubscription();

  const cancelSubscription = useCancelSubscription();
  const upgradeSubscription = useUpgradeSubscription();

  // State variables
  const [errorType, setErrorType] = useState<"cancel" | "resume">("cancel");
  const [showConfigError, setShowConfigError] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Current usage - in a real app, you would fetch this from your API
  const currentUsage = DEFAULT_USAGE;

  const handleCancelSubscription = async () => {
    try {
      setErrorType("cancel");
      await cancelSubscription.mutateAsync({
        returnUrl: window.location.href,
        // referenceId: activeSubscription?.id,
      });
      // The user will be redirected to Stripe's billing portal
    } catch (err: any) {
      // Check for specific error about Stripe portal configuration
      if (
        err.message?.includes("No configuration provided") ||
        err.message?.includes("default configuration has not been created")
      ) {
        // Show the error dialog instead of an alert
        setShowConfigError(true);

        // Log detailed instructions for developers/admins
        console.error(
          "Stripe Customer Portal not configured. Admin needs to set up the Customer Portal at https://dashboard.stripe.com/test/settings/billing/portal"
        );
      }
    }
  };

  const handleUpgradeSubscription = async (planId: string) => {
    await authClient.subscription.upgrade({
      plan: planId,
      successUrl: "/settings",
      cancelUrl: "/settings",
      referenceId: activeSubscription?.referenceId,
    });
  };

  const handleResumeSubscription = async () => {
    try {
      setErrorType("resume");
      // In a real implementation, you would call the Better Auth API to resume the subscription
      // For now we'll just show a dialog explaining this isn't implemented yet
      setShowConfigError(true);
    } catch (err: any) {
      console.error("Failed to resume subscription:", err);
    }
  };

  const handleShowUpgradeOptions = () => {
    setShowUpgradeDialog(true);
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

  const isActionInProgress =
    cancelSubscription.isPending || upgradeSubscription.isPending;
  const errorMessage =
    subscriptionError?.message ||
    cancelSubscription.error?.message ||
    upgradeSubscription.error?.message ||
    null;

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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Current Plan</CardTitle>
                  <CardDescription>
                    Your current subscription details
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    activeSubscription.cancelAtPeriodEnd
                      ? "outline"
                      : activeSubscription?.status === "active"
                      ? "default"
                      : activeSubscription?.status === "trialing"
                      ? "outline"
                      : "destructive"
                  }
                >
                  {activeSubscription.cancelAtPeriodEnd
                    ? "Cancels Soon"
                    : activeSubscription?.status === "active"
                    ? "Active"
                    : activeSubscription?.status === "trialing"
                    ? "Trial"
                    : activeSubscription?.status === "canceled"
                    ? "Canceled"
                    : activeSubscription?.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Plan</h3>
                    <p className="text-lg font-bold">{currentPlan?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentPlan?.price}/{currentPlan?.interval}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Renewal Date</h3>
                    <p className="text-lg font-bold">
                      {formatDate(activeSubscription?.periodEnd)}
                    </p>
                    {activeSubscription?.cancelAt && (
                      <p className="text-sm text-red-500">
                        Cancels on {formatDate(activeSubscription?.cancelAt)}
                      </p>
                    )}
                  </div>
                </div>

                {activeSubscription?.trialEnd &&
                  new Date(
                    activeSubscription.trialEnd instanceof Date
                      ? activeSubscription.trialEnd
                      : String(activeSubscription.trialEnd)
                  ) > new Date() && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Trial Period</AlertTitle>
                      <AlertDescription>
                        Your trial ends on{" "}
                        {formatDate(activeSubscription?.trialEnd)}. You'll be
                        charged afterward unless you cancel.
                      </AlertDescription>
                    </Alert>
                  )}

                <Separator />

                {/* Usage section */}
                <div>
                  <h3 className="font-medium mb-2">Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Events</span>
                        <span className="text-sm">
                          {currentUsage.events.toLocaleString()} /{" "}
                          {eventLimit.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={usagePercentage} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {activeSubscription.cancelAtPeriodEnd ? (
                <Button
                  variant="default"
                  onClick={handleResumeSubscription}
                  disabled={isActionInProgress}
                >
                  {cancelSubscription.isPending ? (
                    "Processing..."
                  ) : (
                    <>Resume Subscription</>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={isActionInProgress}
                >
                  {cancelSubscription.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      Cancel Subscription <X className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}

              {/* Only show change plan button if there are other plans available */}
              {upgradePlans.length > 0 && (
                <Button
                  onClick={handleShowUpgradeOptions}
                  disabled={isActionInProgress}
                >
                  {upgradeSubscription.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      Change Plan <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>
                What's included in your {currentPlan?.name} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentPlan?.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Need Help?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          For billing questions or subscription support, please contact our
          customer service team.
        </p>
        <Button variant="outline" onClick={() => router.push("/contact")}>
          Contact Support
        </Button>
      </div>

      {/* Update the dialog component to show different content based on error type */}
      <Dialog open={showConfigError} onOpenChange={setShowConfigError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {errorType === "cancel"
                ? "Subscription Cancellation Unavailable"
                : "Subscription Resumption Unavailable"}
            </DialogTitle>
            <DialogDescription className="py-4">
              {errorType === "cancel"
                ? "Our subscription management system is currently being configured. You cannot cancel your subscription at this time."
                : "The option to resume canceled subscriptions is not yet available. Please contact support for assistance."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowConfigError(false)}>Close</Button>
            <Button
              variant="outline"
              onClick={() => {
                router.push("/contact");
                setShowConfigError(false);
              }}
            >
              Contact Support
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade options dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
            <DialogDescription className="py-4">
              Select a plan to switch to
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Plans */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-500" />
                Basic Plans
              </h3>
              <div className="space-y-3">
                {upgradePlans
                  .filter((plan) => plan.name.startsWith("basic"))
                  .map((plan) => (
                    <Card
                      key={plan.priceId}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        activeSubscription?.plan === plan.name
                          ? "ring-2 ring-green-400"
                          : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">
                              {plan.limits.events.toLocaleString()} events
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ${plan.price} / {plan.interval}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={
                              activeSubscription?.plan === plan.name
                                ? "outline"
                                : "default"
                            }
                            onClick={() => {
                              if (activeSubscription?.plan !== plan.name) {
                                handleUpgradeSubscription(plan.name);
                              }
                            }}
                            disabled={activeSubscription?.plan === plan.name}
                          >
                            {activeSubscription?.plan === plan.name
                              ? "Current"
                              : "Select"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Pro Plans */}
            <div>
              <h3 className="font-medium mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-emerald-500" />
                Pro Plans
              </h3>
              <div className="space-y-3">
                {upgradePlans
                  .filter((plan) => plan.name.startsWith("pro"))
                  .map((plan) => (
                    <Card
                      key={plan.priceId}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        activeSubscription?.plan === plan.name
                          ? "ring-2 ring-emerald-400"
                          : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">
                              {plan.limits.events.toLocaleString()} events
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ${plan.price} / {plan.interval}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={
                              activeSubscription?.plan === plan.name
                                ? "outline"
                                : "default"
                            }
                            onClick={() => {
                              if (activeSubscription?.plan !== plan.name) {
                                handleUpgradeSubscription(plan.name);
                              }
                            }}
                            disabled={activeSubscription?.plan === plan.name}
                          >
                            {activeSubscription?.plan === plan.name
                              ? "Current"
                              : "Select"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                router.push("/subscribe");
                setShowUpgradeDialog(false);
              }}
            >
              View All Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
