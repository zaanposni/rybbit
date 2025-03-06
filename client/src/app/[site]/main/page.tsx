"use client";
import { useSiteHasData } from "../../../hooks/api";
import { useGetSiteMetadata } from "../../../hooks/hooks";
import { useStore } from "../../../lib/store";
import { NoData } from "../components/NoData";
import { SubHeader } from "../components/SubHeader/SubHeader";
import { MainSection } from "./components/MainSection/MainSection";
import { Browsers } from "./components/sections/Browsers";
import { Countries } from "./components/sections/Countries";
import { Devices } from "./components/sections/Devices";
import { Map } from "./components/sections/Map";
import { OperatingSystems } from "./components/sections/OperatingSystems";
import { Pages } from "./components/sections/Pages";
import { Referrers } from "./components/sections/Referrers";

export default function MainPage() {
  const { site } = useStore();

  if (!site) {
    return null;
  }

  return <MainPageContent site={site} />;
}

function MainPageContent({ site }: { site: string }) {
  const { siteMetadata, isLoading: isLoadingSiteMetadata } =
    useGetSiteMetadata(site);

  if (isLoadingSiteMetadata || !siteMetadata) {
    return null;
  }

  return (
    <>
      <SubHeader />
      <MainSection />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <OperatingSystems />
        <Browsers />
        <Devices />
        <Pages siteMetadata={siteMetadata} />
        <Referrers />
        <Countries />
        <Map />
        {/* <Chloropleth /> */}
      </div>
    </>
  );
}
