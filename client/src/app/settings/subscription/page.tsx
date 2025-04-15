"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { STRIPE_PRICES } from "@/lib/stripe";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "../../../lib/auth";
import { PlanFeaturesCard } from "./components/PlanFeaturesCard";
import { DEFAULT_EVENT_LIMIT } from "./utils/constants";
import { getPlanDetails, formatDate } from "./utils/planUtils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Define StripePlan locally as it's not exported from @/lib/stripe
interface StripePlan {
  priceId: string;
  price: number;
  name: string;
  interval: string;
  limits: {
    events: number;
  };
  annualDiscountPriceId?: string; // Optional for annual plans
}

interface SubscriptionData {
  id: string;
  planName: string;
  status: string;
  currentPeriodEnd: string;
  eventLimit: number;
  interval: string;
  cancelAtPeriodEnd?: boolean;
}

// Define PlanTemplate locally to match getPlanDetails return type
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

function useStripeSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/stripe/subscription`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setData(null);
          setError(null);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
        }
      } else {
        const result = await response.json();
        setData(result);
      }
    } catch (err: any) {
      console.error("Failed to fetch subscription:", err);
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { data: sessionData } = authClient.useSession();

  const {
    data: activeSubscription,
    isLoading,
    error: subscriptionError,
    refetch,
  } = useStripeSubscription();

  console.info("activeSubscription", activeSubscription);

  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentUsage = activeSubscription?.eventLimit || 0;

  const handleManageSubscription = async () => {
    setActionError(null);
    setIsProcessing(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const response = await fetch(
        `${backendUrl}/api/stripe/create-portal-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            returnUrl: window.location.href,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session.");
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        throw new Error("Portal URL not received.");
      }
    } catch (err: any) {
      console.error("Portal Session Error:", err);
      setActionError(err.message || "Could not open billing portal.");
      toast.error(`Error: ${err.message || "Could not open billing portal."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowUpgradeOptions = () => {
    setShowUpgradeDialog(true);
    setActionError(null);
  };

  const currentPlanDetails: PlanTemplate | null = activeSubscription
    ? getPlanDetails(activeSubscription.planName)
    : null;

  console.info("currentPlanDetails (from getPlanDetails):", currentPlanDetails);

  const eventLimit = activeSubscription?.eventLimit || DEFAULT_EVENT_LIMIT;
  const usagePercentage =
    eventLimit > 0 ? (currentUsage / eventLimit) * 100 : 0;
  const isAnnualPlan = activeSubscription?.interval === "year";

  const getFormattedPrice = () => {
    if (!currentPlanDetails) return "$0/month";
    return `${currentPlanDetails.price}/${
      currentPlanDetails.interval === "year" ? "year" : "month"
    }`;
  };

  const formatRenewalDate = () => {
    if (!activeSubscription?.currentPeriodEnd) return "N/A";
    const formattedDate = formatDate(activeSubscription.currentPeriodEnd);

    if (activeSubscription.cancelAtPeriodEnd) {
      return `Ends on ${formattedDate}`;
    }
    if (activeSubscription.status === "active") {
      return isAnnualPlan
        ? `Renews annually on ${formattedDate}`
        : `Renews monthly on ${formattedDate}`;
    }
    return `Status: ${activeSubscription.status}, ends/renews ${formattedDate}`;
  };

  const errorMessage = subscriptionError?.message || actionError || null;

  const upgradePlans = STRIPE_PRICES.filter(
    (p: StripePlan) => p.name !== activeSubscription?.planName
  ).sort((a: StripePlan, b: StripePlan) => a.limits.events - b.limits.events);

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your subscription and billing information
          </p>
        </div>
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
          <AlertTitle>Error Fetching Subscription</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : !activeSubscription ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>
                You are currently on the Free Plan. Upgrade to unlock premium
                features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Plan</h3>
                    <p className="text-lg font-bold">Free</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      $0/month
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Renewal Date</h3>
                    <p className="text-lg font-bold">Never expires</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium mb-2">Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Events</span>
                        <span className="text-sm">
                          {currentUsage.toLocaleString()} /{" "}
                          {DEFAULT_EVENT_LIMIT.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={(currentUsage / DEFAULT_EVENT_LIMIT) * 100}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push("/subscribe")}>
                Upgrade Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <PlanFeaturesCard currentPlan={getPlanDetails("free")} />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    {currentPlanDetails?.name || activeSubscription.planName}
                    {isAnnualPlan && (
                      <Badge className="ml-2 bg-emerald-500 text-white">
                        Annual
                      </Badge>
                    )}
                    {activeSubscription.cancelAtPeriodEnd && (
                      <Badge className="ml-2 bg-orange-500 text-white">
                        Canceling
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {activeSubscription.cancelAtPeriodEnd
                      ? "Your subscription will end on " +
                        formatDate(activeSubscription.currentPeriodEnd)
                      : activeSubscription.status === "active"
                      ? "Your subscription is active."
                      : `Status: ${activeSubscription.status}`}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Change Plan"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Plan</h3>
                    <p className="text-lg font-bold">
                      {currentPlanDetails?.name || activeSubscription.planName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getFormattedPrice()}
                    </p>
                    {isAnnualPlan && (
                      <div className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <p>You save by paying annually (2 months free)</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">Billing Period</h3>
                    <p className="text-lg font-bold">{formatRenewalDate()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeSubscription.cancelAtPeriodEnd
                        ? "Your subscription will not renew after this date"
                        : isAnnualPlan
                        ? "Your plan renews once per year"
                        : "Your plan renews monthly"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium mb-2">Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Events</span>
                        <span className="text-sm">
                          {currentUsage.toLocaleString()} /{" "}
                          {eventLimit.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={usagePercentage} />
                    </div>
                  </div>
                </div>

                {isAnnualPlan && (
                  <div className="pt-2 pb-0 px-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-100 dark:border-emerald-800">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 py-2">
                      <strong>Annual Billing:</strong> You're on annual billing
                      which saves you money compared to monthly billing. Your
                      subscription will renew once per year on{" "}
                      {formatDate(activeSubscription.currentPeriodEnd)}.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Conditionally render PlanFeaturesCard only when details are available */}
          {!isLoading && currentPlanDetails && (
            <PlanFeaturesCard currentPlan={currentPlanDetails as any} />
          )}
        </div>
      )}
    </div>
  );
}
