"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, Zap, Shield, Clock, Users } from "lucide-react";
import { authClient } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STRIPE_PRICES } from "@/lib/stripe";
import { Slider } from "@/components/ui/slider";

// Available event tiers for the slider
const EVENT_TIERS = [20_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000];

// Define types for plans
interface PlanTemplate {
  id: "free" | "basic" | "pro";
  name: string;
  price?: string;
  interval?: string;
  description: string;
  baseFeatures: string[];
  color: string;
  icon: React.ReactNode;
}

interface Plan extends PlanTemplate {
  price: string;
  interval: string;
  features: string[];
}

interface StripePrice {
  priceId: string;
  price: number;
  name: string;
  interval: string;
  limits: {
    events: number;
  };
}

// Plan templates
const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    interval: "month",
    description: "Get started with basic analytics",
    baseFeatures: [
      "Basic analytics",
      "7-day data retention",
      "Community support",
    ],
    color:
      "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    id: "basic",
    name: "Basic",
    description: "Essential analytics for small projects",
    baseFeatures: [
      "Core analytics features",
      "14-day data retention",
      "Basic support",
    ],
    color:
      "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-800 dark:to-emerald-800",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced analytics for growing businesses",
    baseFeatures: [
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
];

// Format price with dollar sign
function getFormattedPrice(plan: StripePrice): string {
  return `$${plan.price}`;
}

// Find the appropriate price for a tier at current event limit
function findPriceForTier(
  tier: "basic" | "pro",
  eventLimit: number
): StripePrice | null {
  const plans = STRIPE_PRICES.filter((plan) => plan.name.startsWith(tier));
  return (
    plans.find((plan) => plan.limits.events >= eventLimit) ||
    plans[plans.length - 1] ||
    null
  );
}

export default function Subscribe() {
  const [selectedTier, setSelectedTier] = useState<"free" | "basic" | "pro">(
    "free"
  );
  const [eventLimitIndex, setEventLimitIndex] = useState<number>(1); // Default to 100k (index 1)
  const [selectedPrice, setSelectedPrice] = useState<StripePrice | null>(null);

  // Get the actual event limit value from the index
  const eventLimit = EVENT_TIERS[eventLimitIndex];

  // Group plans by type
  const basicPlans = STRIPE_PRICES.filter((plan) =>
    plan.name.startsWith("basic")
  );
  const proPlans = STRIPE_PRICES.filter((plan) => plan.name.startsWith("pro"));

  // Update the selected price when tier or event limit changes
  useEffect(() => {
    if (selectedTier === "free") {
      setSelectedPrice(null);
      return;
    }

    const plans = selectedTier === "basic" ? basicPlans : proPlans;
    const matchingPlan =
      plans.find((plan) => plan.limits.events >= eventLimit) ||
      plans[plans.length - 1];

    setSelectedPrice(matchingPlan);
  }, [selectedTier, eventLimit, basicPlans, proPlans]);

  // Handle subscription
  function handleSubscribe(): void {
    if (!selectedPrice) return;

    authClient.subscription
      .upgrade({
        plan: selectedPrice.name,
        successUrl: "/",
        cancelUrl: "/subscribe",
      })
      .catch((error) => {
        console.error("Subscription error:", error);
      });
  }

  // Handle slider changes
  function handleSliderChange(value: number[]): void {
    setEventLimitIndex(value[0]);
  }

  // Handle tier selection
  function handleTierSelection(tier: "free" | "basic" | "pro"): void {
    setSelectedTier(tier);
  }

  // Find the current prices for each tier based on the event limit
  const basicTierPrice = findPriceForTier("basic", eventLimit);
  const proTierPrice = findPriceForTier("pro", eventLimit);

  // Generate plan objects with current state
  const plans: Plan[] = PLAN_TEMPLATES.map((template) => {
    const plan = { ...template } as Plan;

    if (plan.id === "basic") {
      plan.price = basicTierPrice ? getFormattedPrice(basicTierPrice) : "$19+";
      plan.interval = "month";
    } else if (plan.id === "pro") {
      plan.price = proTierPrice ? getFormattedPrice(proTierPrice) : "$39+";
      plan.interval = "month";
    } else {
      plan.price = "$0";
      plan.interval = "month";
    }

    // Add event limit feature at the beginning
    plan.features = [
      plan.id === "free"
        ? "20,000 events per month"
        : `${eventLimit.toLocaleString()} events per month`,
      ...plan.baseFeatures,
    ];

    return plan;
  });

  return (
    <div className="container mx-auto py-12">
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4 ">
          Choose Your Analytics Plan
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
          Find the perfect plan to track your site's performance
        </p>
      </div>

      <div className="mb-12 max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">
            How many events do you need?
          </h2>
          <div className="flex justify-between mb-4">
            <span className="text-neutral-600 dark:text-neutral-400">
              Events per month
            </span>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
              {eventLimit.toLocaleString()}
            </span>
          </div>
        </div>

        <Slider
          defaultValue={[1]} // Default to index 1 (100k)
          max={EVENT_TIERS.length - 1}
          min={0}
          step={1}
          onValueChange={handleSliderChange}
          className="mb-6"
        />

        <div className="flex justify-between text-xs text-neutral-500">
          {EVENT_TIERS.map((tier, index) => (
            <span
              key={index}
              className={
                eventLimitIndex === index ? "font-bold text-emerald-400" : ""
              }
            >
              {tier === 20_000 ? "Free" : tier.toLocaleString()}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="group transition-all duration-300 h-full"
            onClick={() => handleTierSelection(plan.id)}
          >
            <Card
              className={`flex flex-col h-full transition-transform duration-300 transform ${
                selectedTier === plan.id
                  ? "ring-2 ring-emerald-400 shadow-lg scale-[1.02]"
                  : "hover:scale-[1.01] hover:shadow-md"
              } cursor-pointer overflow-hidden`}
            >
              <div className={`${plan.color} h-3 w-full`}></div>

              <CardHeader className="pb-4">
                <div className="flex items-center mb-2">
                  <div
                    className={`p-1.5 rounded-full mr-2 ${
                      plan.id === "free"
                        ? "bg-gray-100 dark:bg-gray-800"
                        : plan.id === "basic"
                        ? "bg-green-50 dark:bg-green-800"
                        : "bg-emerald-50 dark:bg-emerald-800"
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>

                <CardDescription className="space-y-3">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="ml-1 text-neutral-500">
                      /{plan.interval}
                    </span>
                  </div>
                  <p>{plan.description}</p>
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 flex-grow">
                <div className="w-full h-px bg-gray-200 dark:bg-gray-800 mb-4"></div>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={feature} className="flex items-start">
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          i === 0 ? "text-emerald-400" : "text-green-400"
                        } shrink-0`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.id !== "free" && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe();
                    }}
                    disabled={!selectedPrice}
                    className={`w-full ${
                      plan.id === "pro"
                        ? "bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
                        : ""
                    }`}
                    variant={plan.id === "pro" ? "default" : "outline"}
                  >
                    Subscribe to {plan.name}
                  </Button>
                )}
                {plan.id === "free" && (
                  <Button
                    className="w-full border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    variant="outline"
                    disabled
                  >
                    Current Plan
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center text-sm max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center mb-4">
          <Users className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="font-medium">Important Information</span>
        </div>
        <p className="mb-3 text-neutral-600 dark:text-neutral-400">
          All paid plans include a 14-day free trial. No credit card required
          until your trial ends.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400">
          Have questions about our plans?{" "}
          <a
            href="/contact"
            className="text-emerald-400 hover:underline font-medium"
          >
            Contact our sales team
          </a>
        </p>
      </div>
    </div>
  );
}
