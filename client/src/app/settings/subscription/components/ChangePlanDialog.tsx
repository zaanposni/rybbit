import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Shield } from "lucide-react";
import { useEffect, useState } from "react";
// Assuming SubscriptionData is defined in the parent or imported
// import { SubscriptionData } from "../page"; // Adjust path if needed
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // For notifications

// Define StripePlan locally if not imported
interface StripePlan {
  priceId: string;
  price: number;
  name: string;
  interval: string;
  limits: {
    events: number;
  };
  annualDiscountPriceId?: string;
}

// Assuming SubscriptionData is defined in the parent or passed correctly
// If not, define it here based on what `useStripeSubscription` returns
interface SubscriptionData {
  id: string;
  planName: string;
  status: string;
  currentPeriodEnd: string;
  eventLimit: number;
  interval: string;
  cancelAtPeriodEnd?: boolean;
}

interface ChangePlanDialogProps {
  showUpgradeDialog: boolean;
  setShowUpgradeDialog: (show: boolean) => void;
  actionError: string | null; // Keep for displaying errors from parent
  upgradePlans: StripePlan[]; // Use StripePlan type
  activeSubscription: SubscriptionData | null | undefined;
  isProcessing: boolean; // Renaming local processing state
  router: {
    push: (url: string) => void;
  };
}

export function ChangePlanDialog({
  showUpgradeDialog,
  setShowUpgradeDialog,
  actionError: parentActionError, // Rename parent error prop
  upgradePlans,
  activeSubscription,
  isProcessing: parentIsProcessing, // Rename parent processing prop
  router,
}: ChangePlanDialogProps) {
  const [resumingPlan, setResumingPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [localIsProcessing, setLocalIsProcessing] = useState(false); // Local loading state
  const [localActionError, setLocalActionError] = useState<string | null>(null); // Local error state

  // Combined processing state
  const isProcessing = parentIsProcessing || localIsProcessing;
  // Combined error state (prioritize local action error)
  const actionError = localActionError || parentActionError;

  // When dialog opens and subscription is canceled, highlight the current plan
  useEffect(() => {
    if (
      showUpgradeDialog &&
      activeSubscription?.cancelAtPeriodEnd &&
      activeSubscription?.planName
    ) {
      setResumingPlan(activeSubscription.planName);
      // Initialize the annual toggle based on the current subscription
      setIsAnnual(activeSubscription.interval === "year");
    } else if (showUpgradeDialog && activeSubscription?.planName) {
      // Initialize the annual toggle based on the current subscription
      setIsAnnual(activeSubscription.interval === "year");
    } else {
      setResumingPlan(null);
    }
    // Reset local errors when dialog opens
    setLocalActionError(null);
  }, [showUpgradeDialog, activeSubscription]);

  // Filter plans based on the selected billing interval
  const filteredPlans = upgradePlans.filter((plan) =>
    isAnnual ? plan.interval === "year" : plan.interval === "month"
  );

  // Plan selection handler
  const handlePlanSelect = async (selectedPlan: StripePlan) => {
    // Prevent action if already processing or it's the current active plan
    if (
      isProcessing ||
      (activeSubscription?.planName === selectedPlan.name &&
        !activeSubscription?.cancelAtPeriodEnd)
    ) {
      return;
    }

    setLocalIsProcessing(true);
    setLocalActionError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const baseUrl = window.location.origin;
      // Success URL brings user back to settings page
      const successUrl = `${baseUrl}/settings/subscription?session_id={CHECKOUT_SESSION_ID}`;
      // Cancel URL also brings user back to settings page
      const cancelUrl = `${baseUrl}/settings/subscription`;

      const response = await fetch(
        `${backendUrl}/api/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            priceId: selectedPlan.priceId,
            successUrl: successUrl,
            cancelUrl: cancelUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session.");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // Redirect to Stripe
      } else {
        throw new Error("Checkout URL not received.");
      }
    } catch (error: any) {
      console.error("Upgrade/Resume Error:", error);
      const errorMessage = `Failed to ${
        resumingPlan ? "resume" : "change"
      } plan: ${error.message}`;
      setLocalActionError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLocalIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={showUpgradeDialog}
      onOpenChange={(open) => {
        setShowUpgradeDialog(open);
        if (!open) {
          setResumingPlan(null);
          setLocalActionError(null); // Clear local error on close
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {activeSubscription?.cancelAtPeriodEnd
              ? "Resume Subscription"
              : "Change Your Plan"}
          </DialogTitle>
          <DialogDescription className="py-4">
            {activeSubscription?.cancelAtPeriodEnd
              ? "Select a plan to resume your subscription. Your current plan is highlighted."
              : "Select a new plan or billing interval."}
          </DialogDescription>
        </DialogHeader>

        {actionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {resumingPlan && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Resuming Subscription</AlertTitle>
            <AlertDescription>
              Your subscription is set to cancel. Select your current plan below
              to resume, or choose a different plan.
            </AlertDescription>
          </Alert>
        )}

        {/* Billing toggle buttons */}
        <div className="flex justify-center mb-6">
          <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full inline-flex relative">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                !isAnnual
                  ? "bg-white dark:bg-neutral-700 shadow-sm text-black dark:text-white"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              )}
            >
              Monthly
            </button>
            <div className="relative">
              <button
                onClick={() => setIsAnnual(true)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all",
                  isAnnual
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-black dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                )}
              >
                Annual
              </button>
              <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white border-0 pointer-events-none">
                2 months free
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 max-h-[40vh] overflow-y-auto pr-2">
          {filteredPlans.length === 0 ? (
            <p className="text-center text-neutral-500">
              No plans available for this interval.
            </p>
          ) : (
            filteredPlans.map((plan) => {
              const isCurrentActivePlan =
                activeSubscription?.planName === plan.name &&
                !activeSubscription?.cancelAtPeriodEnd;
              const isPlanToResume = resumingPlan === plan.name;
              const isDisabled = isCurrentActivePlan || isProcessing;

              return (
                <Card
                  key={plan.priceId}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    isCurrentActivePlan || isPlanToResume
                      ? "ring-2 ring-green-400"
                      : ""
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">
                          {plan.limits.events.toLocaleString()} events
                          {plan.interval === "year" && (
                            <Badge className="ml-2 bg-emerald-500 text-white border-0 text-xs">
                              Save ~17%
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ${plan.price} / {plan.interval}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isCurrentActivePlan ? "outline" : "default"}
                        onClick={() => handlePlanSelect(plan)}
                        disabled={isDisabled}
                      >
                        {isCurrentActivePlan
                          ? "Current"
                          : isPlanToResume
                          ? "Resume"
                          : isProcessing
                          ? "Processing..."
                          : "Select"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
