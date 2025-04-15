import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { DEFAULT_EVENT_LIMIT } from "../utils/constants";
import { formatDate, getPlanDetails, PlanTemplate } from "../utils/planUtils";
import { useStripeSubscription } from "../utils/useStripeSubscription";
import { PlanFeaturesCard } from "./PlanFeaturesCard";
import { Alert } from "../../../../components/ui/alert";

export function ProPlan() {
  const {
    data: activeSubscription,
    isLoading,
    error: subscriptionError,
    refetch,
  } = useStripeSubscription();

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const eventLimit = activeSubscription?.eventLimit || DEFAULT_EVENT_LIMIT;
  const currentUsage = activeSubscription?.eventLimit || 0;
  const usagePercentage =
    eventLimit > 0 ? (currentUsage / eventLimit) * 100 : 0;
  const isAnnualPlan = activeSubscription?.interval === "year";

  const currentPlanDetails: PlanTemplate | null = activeSubscription
    ? getPlanDetails(activeSubscription.planName)
    : null;

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

  if (!activeSubscription) {
    return null;
  }

  return (
    <div className="space-y-6">
      {actionError && <Alert variant="destructive">{actionError}</Alert>}
      <Card>
        <CardContent>
          <div className="space-y-6 mt-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-3xl font-bold">
                  {currentPlanDetails?.name || activeSubscription.planName}
                </p>
                <p className="text text-gray-300">{getFormattedPrice()}</p>
                {isAnnualPlan && (
                  <div className="mt-2 text-sm text-emerald-400">
                    <p>You save by paying annually (2 months free)</p>
                  </div>
                )}
                <p className="text-neutral-400 text-sm">
                  {formatRenewalDate()}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Change Plan"}
              </Button>
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
  );
}
