"use client";

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
import { Slider } from "@/components/ui/slider";
import { authClient } from "@/lib/auth";
import { STRIPE_PRICES } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StandardPage } from "../../components/StandardPage";
import { BACKEND_URL } from "../../lib/const";

// Available event tiers for the slider
const EVENT_TIERS = [
  100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000,
];

// Define types for plans
interface PlanTemplate {
  id: "free" | "pro";
  name: string;
  price?: string;
  interval?: string;
  description: string;
  baseFeatures: string[];
  color: string;
}

interface Plan extends PlanTemplate {
  price: string;
  interval: string;
  features: string[];
  monthlyPrice?: number;
  annualPrice?: number;
  savings?: string;
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
    baseFeatures: ["6 month data retention"],
    color:
      "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced analytics for growing projects",
    baseFeatures: ["5 year data retention", "Priority support"],
    color:
      "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-800 dark:to-emerald-800",
  },
];

// Format price with dollar sign
function getFormattedPrice(price: number): string {
  return `$${price}`;
}

// Find the appropriate price for a tier at current event limit
function findPriceForTier(
  tier: "free" | "pro",
  eventLimit: number,
  interval: "month" | "year"
): StripePrice | null {
  // Determine if we need to look for annual plans
  const isAnnual = interval === "year";
  const namePattern = isAnnual ? `${tier}-annual` : tier;

  // Filter plans by name pattern (with or without -annual suffix) and interval
  const plans = STRIPE_PRICES.filter(
    (plan) =>
      (isAnnual
        ? plan.name.startsWith(tier) && plan.name.includes("-annual")
        : plan.name.startsWith(tier) && !plan.name.includes("-annual")) &&
      plan.interval === interval
  );

  // Find a plan that matches or exceeds the event limit
  const matchingPlan = plans.find((plan) => plan.limits.events >= eventLimit);
  const selectedPlan = matchingPlan || plans[plans.length - 1] || null;

  // Return the matching plan or the highest tier available
  return selectedPlan;
}

// Calculate savings percentage between monthly and annual plans
function calculateSavings(monthlyPrice: number, annualPrice: number): string {
  const monthlyCost = monthlyPrice * 12;
  const savings = monthlyCost - annualPrice;
  const savingsPercent = Math.round((savings / monthlyCost) * 100);
  return `Save ${savingsPercent}%`;
}

export default function Subscribe() {
  const [selectedTier, setSelectedTier] = useState<"free" | "pro">("free");
  const [eventLimitIndex, setEventLimitIndex] = useState<number>(0); // Default to 20k (index 0)
  const [isAnnual, setIsAnnual] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const { data: sessionData } = authClient.useSession();

  const eventLimit = EVENT_TIERS[eventLimitIndex];

  // TODO: Implement proper check if user already has an active subscription
  const isFreeAvailable = !!sessionData?.user; // Placeholder check based on login

  // Handle subscription
  async function handleSubscribe(planId: "free" | "pro"): Promise<void> {
    if (planId === "free") {
      return;
    }

    // Check if user is logged in directly
    if (!sessionData?.user) {
      toast.error("Please log in to subscribe.");
      return;
    }

    if (planId === "pro") {
      const selectedTierPrice = findPriceForTier(
        "pro",
        eventLimit,
        isAnnual ? "year" : "month"
      );

      if (!selectedTierPrice) {
        toast.error(
          "Selected pricing plan not found. Please adjust the slider."
        );
        return;
      }

      setIsLoading(true);
      try {
        // Use NEXT_PUBLIC_BACKEND_URL if available, otherwise use relative path for same-origin requests
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/settings/subscription?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/subscribe`;

        const response = await fetch(
          `${BACKEND_URL}/stripe/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Send cookies
            body: JSON.stringify({
              priceId: selectedTierPrice.priceId,
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
          window.location.href = data.checkoutUrl; // Redirect to Stripe checkout
        } else {
          throw new Error("Checkout URL not received.");
        }
      } catch (error: any) {
        toast.error(`Subscription failed: ${error.message}`);
        setIsLoading(false); // Stop loading on error
      }
    }
  }

  // Handle slider changes
  function handleSliderChange(value: number[]): void {
    setEventLimitIndex(value[0]);

    // If event limit is over 20k, ensure free plan is not selected
    if (EVENT_TIERS[value[0]] > 10_000 && selectedTier === "free") {
      setSelectedTier("pro");
    }
  }

  // Find the current prices for each tier based on the event limit
  const interval = isAnnual ? "year" : "month";
  const basicTierPrice = findPriceForTier("pro", eventLimit, interval);

  // Also get monthly prices for savings calculation
  const basicMonthly = findPriceForTier("pro", eventLimit, "month");
  const basicAnnual = findPriceForTier("pro", eventLimit, "year");

  // Generate plan objects with current state
  const plans: Plan[] = PLAN_TEMPLATES.map((template) => {
    const plan = { ...template } as Plan;

    if (plan.id === "pro") {
      const tierPrice = basicTierPrice;
      plan.price = tierPrice ? getFormattedPrice(tierPrice.price) : "$19+";
      plan.interval = isAnnual ? "year" : "month";

      if (basicMonthly && basicAnnual) {
        plan.monthlyPrice = basicMonthly.price;
        plan.annualPrice = basicAnnual.price;
        plan.savings = calculateSavings(basicMonthly.price, basicAnnual.price);
      }
    } else {
      plan.price = "$0";
      plan.interval = "month";
    }

    // Add event limit feature at the beginning
    const eventFeature =
      plan.id === "free"
        ? "10,000 events per month"
        : `${Math.max(eventLimit, 100_000).toLocaleString()} events per month`;

    plan.features = [eventFeature, ...plan.baseFeatures];

    return plan;
  });

  return (
    <StandardPage>
      <div className="container mx-auto py-12">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-4 ">
            Choose Your Analytics Plan
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
            Find the perfect plan to track your site's performance
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[300px_auto] max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.id} className="transition-all duration-300 h-full">
              <Card
                className={`flex flex-col h-full transition-transform duration-300 transform hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden ${
                  plan.id === "free" && !isFreeAvailable
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <div className={`${plan.color} h-3 w-full`}></div>

                <CardHeader className="pb-4">
                  <CardTitle className="text-3xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <p>{plan.description}</p>
                  </CardDescription>
                </CardHeader>

                {plan.id === "pro" && (
                  <>
                    <CardContent className="pb-0">
                      {/* Billing toggle buttons */}
                      <div className="flex justify-center mb-6">
                        <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg inline-flex relative">
                          <button
                            onClick={() => setIsAnnual(false)}
                            className={cn(
                              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
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
                                "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                                isAnnual
                                  ? "bg-white dark:bg-neutral-700 shadow-sm text-black dark:text-white"
                                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                              )}
                            >
                              Annual
                            </button>
                            <Badge
                              className="absolute -top-4 -right-2  text-white border-0 pointer-events-none"
                              variant="green"
                            >
                              2 months free
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Event slider */}
                      <div className="mb-6">
                        <div className="mb-4">
                          <div className="flex justify-between mb-2 items-center">
                            <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                              Events per month
                              <div className="font-bold text-lg text-white">
                                {eventLimit.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                                {plan.price}
                              </span>
                              {plan.interval && (
                                <span className="ml-1 text-neutral-500">
                                  /{plan.interval}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Slider
                          defaultValue={[0]} // Default to index 0 (20k)
                          max={EVENT_TIERS.length - 1}
                          min={0}
                          step={1}
                          onValueChange={handleSliderChange}
                          className="mb-3"
                        />

                        <div className="flex justify-between text-xs text-neutral-500">
                          {EVENT_TIERS.map((tier, index) => (
                            <span
                              key={index}
                              className={
                                eventLimitIndex === index
                                  ? "font-bold text-white"
                                  : ""
                              }
                            >
                              {tier >= 1_000_000
                                ? `${tier / 1_000_000}M`
                                : `${tier / 1_000}K`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}

                <CardContent className={"pt-0 flex-grow"}>
                  <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800 mb-4"></div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={`${feature}-${i}`} className="flex items-start">
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
                  {plan.id === "pro" ? (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      className="w-full"
                      disabled={isLoading}
                      variant="success"
                    >
                      {isLoading
                        ? "Processing..."
                        : `Subscribe to ${plan.name}`}
                    </Button>
                  ) : (
                    <Button
                      className="w-full border-neutral-300 text-gray-700 dark:border-neutral-700 dark:text-neutral-300"
                      variant="outline"
                      disabled={!isFreeAvailable}
                    >
                      {isFreeAvailable ? "Current Plan" : "Not Available"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </StandardPage>
  );
}
