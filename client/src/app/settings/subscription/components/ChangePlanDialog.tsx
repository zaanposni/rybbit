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
import { Subscription } from "@/hooks/api";
import { AlertCircle, Shield, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface ChangePlanDialogProps {
  showUpgradeDialog: boolean;
  setShowUpgradeDialog: (show: boolean) => void;
  actionError: string | null;
  upgradePlans: any[];
  activeSubscription: Subscription | null | undefined;
  isProcessing: boolean;
  handleUpgradeSubscription: (planId: string) => Promise<void>;
  router: {
    push: (url: string) => void;
  };
}

export function ChangePlanDialog({
  showUpgradeDialog,
  setShowUpgradeDialog,
  actionError,
  upgradePlans,
  activeSubscription,
  isProcessing,
  handleUpgradeSubscription,
  router,
}: ChangePlanDialogProps) {
  // State to track if we're resuming a subscription
  const [resumingPlan, setResumingPlan] = useState<string | null>(null);

  // When dialog opens and subscription is canceled, highlight the current plan
  useEffect(() => {
    if (
      showUpgradeDialog &&
      activeSubscription?.cancelAtPeriodEnd &&
      activeSubscription?.plan
    ) {
      setResumingPlan(activeSubscription.plan);
    } else {
      setResumingPlan(null);
    }
  }, [showUpgradeDialog, activeSubscription]);

  return (
    <Dialog
      open={showUpgradeDialog}
      onOpenChange={(open) => {
        setShowUpgradeDialog(open);
        if (!open) setResumingPlan(null);
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
              : "Select a plan to switch to"}
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
              Your current plan is highlighted. Click "Select" to resume this
              plan or choose a different one.
            </AlertDescription>
          </Alert>
        )}

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
                      (activeSubscription?.plan === plan.name &&
                        !activeSubscription?.cancelAtPeriodEnd) ||
                      resumingPlan === plan.name
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
                            (activeSubscription?.plan === plan.name &&
                              !activeSubscription?.cancelAtPeriodEnd) ||
                            (resumingPlan === plan.name &&
                              resumingPlan === activeSubscription?.plan)
                              ? "outline"
                              : "default"
                          }
                          onClick={() => {
                            if (
                              activeSubscription?.plan !== plan.name ||
                              activeSubscription?.cancelAtPeriodEnd
                            ) {
                              handleUpgradeSubscription(plan.name);
                            }
                          }}
                          disabled={
                            (activeSubscription?.plan === plan.name &&
                              !activeSubscription?.cancelAtPeriodEnd) ||
                            isProcessing
                          }
                        >
                          {activeSubscription?.plan === plan.name &&
                          !activeSubscription?.cancelAtPeriodEnd
                            ? "Current"
                            : resumingPlan === plan.name &&
                              resumingPlan === activeSubscription?.plan
                            ? "Resume"
                            : isProcessing
                            ? "Processing..."
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
                      (activeSubscription?.plan === plan.name &&
                        !activeSubscription?.cancelAtPeriodEnd) ||
                      resumingPlan === plan.name
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
                            (activeSubscription?.plan === plan.name &&
                              !activeSubscription?.cancelAtPeriodEnd) ||
                            (resumingPlan === plan.name &&
                              resumingPlan === activeSubscription?.plan)
                              ? "outline"
                              : "default"
                          }
                          onClick={() => {
                            if (
                              activeSubscription?.plan !== plan.name ||
                              activeSubscription?.cancelAtPeriodEnd
                            ) {
                              handleUpgradeSubscription(plan.name);
                            }
                          }}
                          disabled={
                            (activeSubscription?.plan === plan.name &&
                              !activeSubscription?.cancelAtPeriodEnd) ||
                            isProcessing
                          }
                        >
                          {activeSubscription?.plan === plan.name &&
                          !activeSubscription?.cancelAtPeriodEnd
                            ? "Current"
                            : resumingPlan === plan.name &&
                              resumingPlan === activeSubscription?.plan
                            ? "Resume"
                            : isProcessing
                            ? "Processing..."
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
          <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
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
  );
}
