import { ArrowRight } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { DEFAULT_EVENT_LIMIT } from "../utils/constants";
import { getPlanDetails } from "../utils/planUtils";
import { useStripeSubscription } from "../utils/useStripeSubscription";
import { PlanFeaturesCard } from "./PlanFeaturesCard";
import { useRouter } from "next/navigation";

export function FreePlan() {
  const {
    data: activeSubscription,
    isLoading,
    error: subscriptionError,
    refetch,
  } = useStripeSubscription();

  const currentUsage = activeSubscription?.eventLimit || 0;

  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Free Plan</CardTitle>
          <CardDescription>
            You are currently on the Free Plan. Upgrade to unlock more events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
          <Button onClick={() => router.push("/subscribe")} variant={"success"}>
            Upgrade Plan <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <PlanFeaturesCard currentPlan={getPlanDetails("free")} />
    </div>
  );
}
