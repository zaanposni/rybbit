import { useQuery } from "@tanstack/react-query";
import { authedFetchWithError } from "../api/utils";
import { BACKEND_URL } from "./const";

interface Configs {
  disableSignup: boolean;
}

export function useConfigs() {
  const { data, isLoading, error } = useQuery<Configs>({
    queryKey: ["configs"],
    queryFn: () => authedFetchWithError<Configs>(`${BACKEND_URL}/config`),
  });

  return {
    configs: data,
    isLoading,
    error,
  };
}
