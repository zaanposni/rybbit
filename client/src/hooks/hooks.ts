import { useGetSites } from "./api";

export function useGetSiteMetadata(siteId: string) {
  const { data, isLoading } = useGetSites();
  return {
    siteMetadata: data?.data?.find((site) => site.siteId === Number(siteId)),
    isLoading,
  };
}
