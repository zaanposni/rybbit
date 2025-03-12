import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import { PlanTemplate } from "../utils/planUtils";

interface PlanFeaturesCardProps {
  currentPlan: PlanTemplate | null;
}

export function PlanFeaturesCard({ currentPlan }: PlanFeaturesCardProps) {
  return (
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
  );
}
