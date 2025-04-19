import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { PlanTemplate } from "../utils/planUtils";
import { Badge } from "@/components/ui/badge";

interface PlanFeaturesCardProps {
  currentPlan: PlanTemplate | null;
}

export function PlanFeaturesCard({ currentPlan }: PlanFeaturesCardProps) {
  // Check if this is an annual plan
  const isAnnualPlan = currentPlan?.interval === "year";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>
              What's included in your {currentPlan?.name} plan
              {isAnnualPlan && <span className="ml-1">(Annual)</span>}
            </CardDescription>
          </div>
          {isAnnualPlan && (
            <Badge className="bg-emerald-500 text-white font-semibold">
              Annual Plan
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {currentPlan?.features?.map((feature, i) => (
            <li key={i} className="flex items-start">
              <Check className="mr-2 h-5 w-5 text-green-500 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
