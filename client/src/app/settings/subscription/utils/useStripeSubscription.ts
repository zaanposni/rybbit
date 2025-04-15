import { useEffect, useState } from "react";

// Define StripePlan locally as it's not exported from @/lib/stripe
interface StripePlan {
  priceId: string;
  price: number;
  name: string;
  interval: string;
  limits: {
    events: number;
  };
  annualDiscountPriceId?: string; // Optional for annual plans
}

interface SubscriptionData {
  id: string;
  planName: string;
  status: string;
  currentPeriodEnd: string;
  eventLimit: number;
  interval: string;
  cancelAtPeriodEnd?: boolean;
}

// Define PlanTemplate locally to match getPlanDetails return type
interface PlanTemplate {
  id: string;
  name: string;
  price: string;
  interval: string;
  description: string;
  features: string[];
  color: string;
  icon: React.ReactNode;
}

export function useStripeSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/stripe/subscription`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setData(null);
          setError(null);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
        }
      } else {
        const result = await response.json();
        setData(result);
      }
    } catch (err: any) {
      console.error("Failed to fetch subscription:", err);
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error, refetch: fetchData };
}
