"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StandardPage } from "../../components/StandardPage";
import { toast } from "sonner";

// Available event tiers for the slider
const EVENT_TIERS = [
  20_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
  10_000_000,
];

// Define types for plans
interface PlanTemplate {
  id: "free" | "basic";
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
    baseFeatures: [
      "Basic analytics",
      "7-day data retention",
      "Community support",
    ],
    color:
      "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900",
  },
  {
    id: "basic",
    name: "Pro",
    description: "Advanced analytics for growing projects",
    baseFeatures: [
      "Advanced analytics features",
      "14-day data retention",
      "Priority support",
    ],
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
  tier: "basic",
  eventLimit: number,
  interval: "month" | "year"
): StripePrice | null {
  console.log(
    `Finding price for tier: ${tier}, event limit: ${eventLimit}, interval: ${interval}`
  );

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

  console.log(
    `Filtered plans for ${namePattern} with interval ${interval}:`,
    plans.map((p) => ({
      name: p.name,
      interval: p.interval,
      events: p.limits.events,
      price: p.price,
    }))
  );

  if (plans.length === 0) {
    console.warn(`No plans found for ${namePattern} with interval ${interval}`);
    return null;
  }

  // Find a plan that matches or exceeds the event limit
  const matchingPlan = plans.find((plan) => plan.limits.events >= eventLimit);
  const selectedPlan = matchingPlan || plans[plans.length - 1] || null;

  if (selectedPlan) {
    console.log(
      `Selected plan: ${selectedPlan.name} (${selectedPlan.interval}) - $${selectedPlan.price} - ${selectedPlan.limits.events} events`
    );
  } else {
    console.log(
      `No plan selected for ${namePattern} with interval ${interval}`
    );
  }

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

// Function to get the direct plan ID based on criteria
function getDirectPlanID(
  tier: "basic",
  eventLimit: number,
  isAnnual: boolean
): string {
  // Base pattern for plan names is like "basic100k" or "pro250k"
  let planPrefix = tier;
  let eventSuffix = "";

  // Determine event tier suffix
  if (eventLimit <= 100_000) {
    eventSuffix = "100k";
  } else if (eventLimit <= 250_000) {
    eventSuffix = "250k";
  } else if (eventLimit <= 500_000) {
    eventSuffix = "500k";
  } else if (eventLimit <= 1_000_000) {
    eventSuffix = "1m";
  } else if (eventLimit <= 2_000_000) {
    eventSuffix = "2m";
  } else if (eventLimit <= 5_000_000) {
    eventSuffix = "5m";
  } else {
    eventSuffix = "10m";
  }

  // Construct the plan name with annual suffix if needed
  const planName = `${planPrefix}${eventSuffix}${isAnnual ? "-annual" : ""}`;
  console.log(`Constructed plan name: ${planName} for isAnnual=${isAnnual}`);

  return planName;
}

export default function Subscribe() {
  const [selectedTier, setSelectedTier] = useState<"free" | "basic">("free");
  const [eventLimitIndex, setEventLimitIndex] = useState<number>(0); // Default to 20k (index 0)
  const [selectedPrice, setSelectedPrice] = useState<StripePrice | null>(null);
  const [isAnnual, setIsAnnual] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const { data: sessionData } = authClient.useSession();

  const eventLimit = EVENT_TIERS[eventLimitIndex];

  // TODO: Implement proper check if user already has an active subscription
  const isFreeAvailable = !!sessionData?.user; // Placeholder check based on login

  // Group plans by type and interval
  const basicMonthlyPlans = STRIPE_PRICES.filter(
    (plan) => plan.name.startsWith("basic") && !plan.name.includes("-annual")
  );
  const basicAnnualPlans = STRIPE_PRICES.filter(
    (plan) => plan.name.includes("basic") && plan.name.includes("-annual")
  );

  // Update the selected price when tier or event limit changes
  useEffect(() => {
    if (selectedTier === "free") {
      setSelectedPrice(null);
      return;
    }

    // Get the correct set of plans based on the tier and interval
    let filteredPlans;
    if (selectedTier === "basic") {
      filteredPlans = isAnnual ? basicAnnualPlans : basicMonthlyPlans;
    }

    const matchingPlan =
      filteredPlans?.find((plan) => plan.limits.events >= eventLimit) ||
      filteredPlans?.[filteredPlans.length - 1];
    if (matchingPlan) {
      setSelectedPrice(matchingPlan);
    }
  }, [selectedTier, eventLimit, isAnnual]);

  // Handle subscription
  async function handleSubscribe(planId: "free" | "basic"): Promise<void> {
    if (planId === "free") {
      return;
    }

    // Check if user is logged in directly
    if (!sessionData?.user) {
      toast.error("Please log in to subscribe.");
      return;
    }

    if (planId === "basic") {
      const selectedTierPrice = findPriceForTier(
        "basic",
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
        const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/settings/subscription?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/subscribe`;

        const response = await fetch(
          `${backendBaseUrl}/api/stripe/create-checkout-session`,
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
        console.error("Subscription Error:", error);
        toast.error(`Subscription failed: ${error.message}`);
        setIsLoading(false); // Stop loading on error
      }
    }
  }

  // Handle slider changes
  function handleSliderChange(value: number[]): void {
    setEventLimitIndex(value[0]);

    // If event limit is over 20k, ensure free plan is not selected
    if (EVENT_TIERS[value[0]] > 20_000 && selectedTier === "free") {
      setSelectedTier("basic");
    }
  }

  // Find the current prices for each tier based on the event limit
  const interval = isAnnual ? "year" : "month";
  const basicTierPrice = findPriceForTier("basic", eventLimit, interval);

  // Also get monthly prices for savings calculation
  const basicMonthly = findPriceForTier("basic", eventLimit, "month");
  const basicAnnual = findPriceForTier("basic", eventLimit, "year");

  // Generate plan objects with current state
  const plans: Plan[] = PLAN_TEMPLATES.map((template) => {
    const plan = { ...template } as Plan;

    if (plan.id === "basic") {
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
        ? "20,000 events per month"
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

          {/* Billing toggle buttons */}
          <div className="flex justify-center mb-8 mt-10">
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
        </div>

        <div className="mb-12 max-w-3xl mx-auto p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800">
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
            defaultValue={[0]} // Default to index 0 (20k)
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
                {tier.toLocaleString()}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
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
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="space-y-3">
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
                    {isAnnual && plan.id !== "free" && (
                      <Badge className="bg-emerald-500 text-white border-0">
                        2 months free
                      </Badge>
                    )}
                    <p>{plan.description}</p>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 flex-grow">
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
                  {plan.id === "basic" ? (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      className="w-full"
                      disabled={isLoading}
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
