import { Clock, Shield, Zap } from "lucide-react";
import { STRIPE_PRICES } from "@/lib/stripe";
import { DEFAULT_EVENT_LIMIT, TRIAL_EVENT_LIMIT } from "./constants";

// Define interfaces for plan data
export interface PlanTemplate {
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
export const getPlanDetails = (
  planName: string | undefined
): PlanTemplate | null => {
  if (!planName) return null;

  // Handle the case for trial separately
  if (planName === "trial") {
    return {
      id: "trial",
      name: "Trial",
      price: "$0",
      interval: "trial",
      description: "Try all Pro features free for 14 days",
      features: [
        `${TRIAL_EVENT_LIMIT.toLocaleString()} events during trial`,
        "All Pro features included",
        "No credit card required",
      ],
      color:
        "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900",
      icon: <Zap className="h-5 w-5 text-blue-500" />,
    };
  }

  const tier = planName.startsWith("pro") ? "pro" : "free";
  const stripePlan = STRIPE_PRICES.find((p) => p.name === planName);

  const planTemplates: Record<string, PlanTemplate> = {
    free: {
      id: "free",
      name: "Free",
      price: "$0",
      interval: "month",
      description: "Get started with basic analytics",
      features: [
        `${DEFAULT_EVENT_LIMIT.toLocaleString()} events per month`,
        "6 month data retention",
      ],
      color:
        "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
      icon: <Clock className="h-5 w-5" />,
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: "$19+",
      interval: "month",
      description: "Advanced analytics for growing projects",
      features: ["5 year data retention", "Priority support"],
      color:
        "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-800 dark:to-emerald-800",
      icon: <Shield className="h-5 w-5" />,
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
export const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A";
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};
