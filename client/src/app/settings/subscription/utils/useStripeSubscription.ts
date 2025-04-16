import { useQuery } from "@tanstack/react-query";

interface SubscriptionData {
  id: string;
  planName: string;
  status: string;
  currentPeriodEnd: string;
  monthlyEventCount: number;
  eventLimit: number;
  interval: string;
  cancelAtPeriodEnd?: boolean;
}

export function useStripeSubscription() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const fetchSubscription = async () => {
    const response = await fetch(`${backendUrl}/api/stripe/subscription`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
    }

    return response.json();
  };

  const { data, isLoading, error, refetch } = useQuery<SubscriptionData>({
    queryKey: ["stripe-subscription"],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return { data, isLoading, error, refetch };
}
