import { BACKEND_URL } from "../../lib/const";
import { useStore } from "../../lib/store";
import { authedFetch, genericQuery, useGenericQuery } from "../utils";

export type GetSitesResponse = {
  siteId: number;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
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

export function useSiteHasData(siteId: string) {
  return useGenericQuery<boolean>(`site-has-data/${siteId}`);
}

export function useGetSiteMetadata() {
  const { site } = useStore();
  const { data, isLoading } = useGetSites();
  return {
    siteMetadata: data?.find(({ siteId }) => siteId === Number(site)),
    isLoading,
  };
}
