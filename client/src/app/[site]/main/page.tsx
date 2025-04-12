"use client";
import { useGetSite } from "../../../api/admin/sites";
import { useStore } from "../../../lib/store";
import { SubHeader } from "../components/SubHeader/SubHeader";
import { MainSection } from "./components/MainSection/MainSection";
import { Countries } from "./components/sections/Countries";
import { Devices } from "./components/sections/Devices";
import { Events } from "./components/sections/Events";
import { Map } from "./components/sections/Map";
import { Pages } from "./components/sections/Pages";
import { Referrers } from "./components/sections/Referrers";

export default function MainPage() {
  const { site } = useStore();

  if (!site) {
    return null;
  }

  return <MainPageContent />;
}

function MainPageContent() {
  const { data: siteMetadata, isLoading: isLoadingSiteMetadata } = useGetSite();

  if (isLoadingSiteMetadata || !siteMetadata) {
    return null;
  }

  return (
    <div className="p-4 max-w-[1300px] mx-auto space-y-3">
      <SubHeader />
      <MainSection />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Devices />
        <Pages />
        <Referrers />
        <Countries />
        <Events />
        <Map />
        {/* <Chloropleth /> */}
      </div>
    </div>
  );
}
