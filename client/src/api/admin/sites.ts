import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { useStore } from "../../lib/store";
import { authedFetch, genericQuery, useGenericQuery } from "../utils";

export type SiteResponse = {
  siteId: number;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  public: boolean;
  isOwner: boolean;
};

export type GetSitesResponse = {
  siteId: number;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  public: boolean;
  overMonthlyLimit?: boolean;
  monthlyEventCount?: number;
  eventLimit?: number;
  isOwner?: boolean;
}[];

export function useGetSites() {
  return useGenericQuery<GetSitesResponse>("get-sites");
}

export async function getSites() {
  return genericQuery<GetSitesResponse>("get-sites");
}

export function addSite(domain: string, name: string, organizationId: string) {
  return authedFetch(`${BACKEND_URL}/add-site`, {
    method: "POST",
    body: JSON.stringify({
      domain,
      name,
      organizationId,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function deleteSite(siteId: number) {
  return authedFetch(`${BACKEND_URL}/delete-site/${siteId}`, {
    method: "POST",
  });
}

export function changeSiteDomain(siteId: number, newDomain: string) {
  return authedFetch(`${BACKEND_URL}/change-site-domain`, {
    method: "POST",
    body: JSON.stringify({
      siteId,
      newDomain,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function changeSitePublic(siteId: number, isPublic: boolean) {
  return authedFetch(`${BACKEND_URL}/change-site-public`, {
    method: "POST",
    body: JSON.stringify({
      siteId,
      isPublic,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function useSiteHasData(siteId: string) {
  return useQuery({
    queryKey: ["site-has-data", siteId],
    queryFn: () => {
      if (!siteId) {
        return Promise.resolve(false);
      }
      return authedFetch(`${BACKEND_URL}/site-has-data/${siteId}`)
        .then((res) => res.json())
        .then((data) => data.hasData as Boolean);
    },
    staleTime: Infinity,
  });
}

export function useGetSite(siteId?: string | number) {
  const { site: storeSelectedSite } = useStore();

  const siteIdToUse = siteId ?? storeSelectedSite;

  return useQuery({
    queryKey: ["get-site", siteIdToUse],
    queryFn: async () => {
      if (!siteIdToUse) {
        return null;
      }

      // Use regular fetch instead of authedFetch to support public sites
      const response = await authedFetch(
        `${BACKEND_URL}/get-site/${siteIdToUse}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch site");
      }

      return response.json() as Promise<SiteResponse>;
    },
    staleTime: 60000, // 1 minute
    enabled: !!siteId,
  });
}
