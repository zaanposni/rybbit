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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Subscription } from "@/hooks/api";
import { PlanTemplate, formatDate } from "../utils/planUtils";
import { AlertCircle, ArrowRight, X } from "lucide-react";

interface CurrentPlanCardProps {
  activeSubscription: Subscription;
  currentPlan: PlanTemplate | null;
  currentUsage: { events: number };
  eventLimit: number;
  usagePercentage: number;
  isProcessing: boolean;
  handleCancelSubscription: () => Promise<void>;
  handleResumeSubscription: () => Promise<void>;
  handleShowUpgradeOptions: () => void;
  upgradePlans: any[];
}

export function CurrentPlanCard({
  activeSubscription,
  currentPlan,
  currentUsage,
  eventLimit,
  usagePercentage,
  isProcessing,
  handleCancelSubscription,
  handleResumeSubscription,
  handleShowUpgradeOptions,
  upgradePlans,
}: CurrentPlanCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Current Plan</CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
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
              <h3 className="font-medium">
                {activeSubscription.cancelAtPeriodEnd ||
                activeSubscription.status === "canceled"
                  ? "Ends On"
                  : "Renewal Date"}
              </h3>
              <p className="text-lg font-bold">
                {formatDate(activeSubscription?.periodEnd)}
              </p>
              {activeSubscription?.cancelAt &&
                !activeSubscription.cancelAtPeriodEnd && (
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
                  Your trial ends on {formatDate(activeSubscription?.trialEnd)}.
                  You'll be charged afterward unless you cancel.
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
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : <>Resume Subscription</>}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleCancelSubscription}
            disabled={isProcessing}
          >
            {isProcessing ? (
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
          <Button onClick={handleShowUpgradeOptions} disabled={isProcessing}>
            {isProcessing ? (
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
  );
}
