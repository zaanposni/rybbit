"use client";

import SessionsList from "@/components/Sessions/SessionsList";
import Avatar from "boring-avatars";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Files,
  FileText,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { DateTime } from "luxon";
import { useParams } from "next/navigation";
import { useUserInfo } from "../../../../api/analytics/userInfo";
import CopyText from "../../../../components/CopyText";
import { useGetRegionName } from "../../../../lib/geo";
import { formatDuration, getCountryName } from "../../../../lib/utils";
import { Browser } from "../../components/shared/icons/Browser";
import { CountryFlag } from "../../components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../components/shared/icons/OperatingSystem";

export default function UserPage() {
  const { userId } = useParams();
  const { site } = useParams();

  const { data } = useUserInfo(Number(site), userId as string);
  const { getRegionName } = useGetRegionName();

  return (
    <div className="mx-auto py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Avatar
            size={40}
            name={userId as string}
            variant="marble"
            colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
          />
          {userId?.slice(0, 10)}
        </h1>
        <div className="bg-neutral-850 p-3 rounded-lg flex flex-col gap-1 border border-neutral-750 text-sm mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid grid-cols-[100px_auto] gap-2">
              <span className=" text-neutral-100">User ID:</span>
              <CopyText
                text={userId as string}
                maxLength={24}
                className="inline-flex text-neutral-300"
              />
              <span className=" text-neutral-100">Language:</span>
              <div className="text-neutral-300">{data?.language}</div>
              <span className="text-neutral-100">Country:</span>
              <div className="text-neutral-300 flex gap-1 items-center">
                <CountryFlag country={data?.country || ""} />
                {data?.country ? getCountryName(data.country) : "N/A"}
              </div>
              <span className=" text-neutral-100">Region:</span>
              <div className="text-neutral-300">
                {data?.iso_3166_2 ? getRegionName(data.iso_3166_2) : "N/A"}
              </div>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <span className=" text-neutral-100">Device Type:</span>
              <div className="text-neutral-300 flex gap-1 items-center">
                {data?.device_type === "Desktop" && (
                  <Monitor className="w-4 h-4" />
                )}
                {data?.device_type === "Mobile" && (
                  <Smartphone className="w-4 h-4" />
                )}
                {data?.device_type === "Tablet" && (
                  <Tablet className="w-4 h-4" />
                )}
                {data?.device_type}
              </div>
              <span className=" text-neutral-100">Browser:</span>
              <div className="flex gap-1 text-neutral-300 items-center">
                <Browser browser={data?.browser || "Unknown"} />
                {data?.browser}
                {data?.browser_version && (
                  <span className="ml-1">v{data?.browser_version}</span>
                )}
              </div>
              <span className="text-neutral-100">OS:</span>
              <div className="flex gap-1 text-neutral-300 items-center">
                <OperatingSystem os={data?.operating_system || ""} />
                {data?.operating_system}
                {data?.operating_system_version && (
                  <span className="ml-1">
                    v{data?.operating_system_version}
                  </span>
                )}
              </div>
              <span className="text-neutral-100">Screen Size:</span>
              <div className="flex gap-1 text-neutral-300">
                {data?.screen_width} x {data?.screen_height}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 justify-between">
          <div className="bg-neutral-850 p-3 rounded-lg flex flex-col gap-1 border border-neutral-750 flex-grow">
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Avg. Session Duration
            </div>
            <div className="font-semibold">
              {data?.duration ? formatDuration(data.duration) : "N/A"}
            </div>
          </div>
          <div className="bg-neutral-850 p-3 rounded-lg flex flex-col gap-1 border border-neutral-750  flex-grow">
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <Files className="w-4 h-4" />
              Sessions
            </div>
            <div className="font-semibold">{data?.sessions}</div>
          </div>
          <div className="bg-neutral-850 p-3 rounded-lg flex flex-col gap-1 border border-neutral-750  flex-grow">
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Pageviews
            </div>
            <div className="font-semibold">{data?.pageviews}</div>
          </div>
          <div className="bg-neutral-850 p-3 rounded-lg flex flex-col gap-1 border border-neutral-750  flex-grow">
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <MousePointerClick className="w-4 h-4" />
              Events
            </div>
            <div className="font-semibold">{data?.events}</div>
          </div>
          <div className="bg-neutral-850 p-3 rounded-lg flex flex-col gap-1 border border-neutral-750  flex-grow">
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              First Seen
            </div>
            <div className="font-semibold">
              {DateTime.fromSQL(data?.first_seen ?? "").toLocaleString(
                DateTime.DATETIME_SHORT
              )}
            </div>
          </div>
          <div className="bg-neutral-850 p-3 rounded-lg flex flex-col gap-1 border border-neutral-750  flex-grow">
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <CalendarCheck className="w-4 h-4" />
              Last Seen
            </div>
            <div className="font-semibold">
              {DateTime.fromSQL(data?.last_seen ?? "").toLocaleString(
                DateTime.DATETIME_SHORT
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Sessions</h2>
      <SessionsList userId={userId as string} />
    </div>
  );
}
