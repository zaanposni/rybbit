import { useMemo } from "react";
import { useGetOverviewBucketedPastMinutes } from "../../../../api/analytics/useGetOverviewBucketed";
import { useStore } from "../../../../lib/store";
import { DateTime } from "luxon";
import { ResponsiveBar } from "@nivo/bar";
import { formatter } from "../../../../lib/utils";
import { nivoTheme } from "../../../../lib/nivo";
import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
} from "../../../../components/ui/card";

export function RealtimeChart() {
  const { site } = useStore();

  const { data, isLoading } = useGetOverviewBucketedPastMinutes({
    pastMinutes: 30,
    site,
    bucket: "minute",
    refetchInterval: 3000,
  });

  const chartData = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return [];
    }

    return data.data.map((point) => ({
      time: DateTime.fromSQL(point.time)
        .toUTC()
        .toFormat("yyyy-MM-dd HH:mm:ss"),
      users: point.users,
    }));
  }, [data]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        style={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        No data available for this period.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Realtime - Last 30 minutes</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: 300 }}>
          <ResponsiveBar
            data={chartData}
            keys={["users"]}
            indexBy="time"
            margin={{ top: 20, right: 0, bottom: 30, left: 35 }}
            padding={0.3}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            // colors={["hsla(210, 40%, 50%, 0.7)"]}
            colors={["hsl(var(--accent-500))"]}
            theme={nivoTheme}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              legend: "",
              legendPosition: "middle",
              legendOffset: 32,
              format: (value: string) => {
                const dt = DateTime.fromFormat(value, "yyyy-MM-dd HH:mm:ss", {
                  zone: "utc",
                }).toLocal();
                return dt.isValid ? dt.toFormat("h:mm") : "";
              },
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "",
              legendPosition: "middle",
              legendOffset: -30,
              format: formatter,
              tickValues: 3,
            }}
            enableLabel={false}
            enableGridX={false}
            enableGridY={true}
            tooltip={({
              id,
              value,
              data,
            }: {
              id: string | number;
              value: number;
              data: { time: string; users: number };
            }) => {
              const currentTime = DateTime.fromFormat(
                data.time,
                "yyyy-MM-dd HH:mm:ss",
                { zone: "utc" }
              ).toLocal();
              const currentY = Number(value);

              return (
                <div className="bg-neutral-950 p-2 rounded-md text-xs">
                  <div className="font-semibold mb-1">
                    {currentTime.isValid
                      ? currentTime.toFormat("HH:mm")
                      : "Invalid Time"}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {currentY.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground ml-1">{id}</span>
                  </div>
                </div>
              );
            }}
            animate={true}
            motionConfig="gentle"
          />
        </div>
      </CardContent>
    </Card>
  );
}
