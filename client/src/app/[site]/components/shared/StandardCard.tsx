"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardLoader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { round } from "lodash";
import { ReactNode, useMemo } from "react";
import { addFilter, FilterParameter } from "../../../../lib/store";
import { formatter } from "../../../../lib/utils";
import { SquareArrowOutUpRight } from "lucide-react";
import { SingleColResponse, useSingleCol } from "../../../../hooks/api";

export function StandardCard({
  title,
  getKey,
  getLabel,
  getValue,
  getLink,
  filterParameter,
}: {
  title: string;
  isFetching?: boolean;
  getKey: (item: SingleColResponse) => string;
  getLabel: (item: SingleColResponse) => ReactNode;
  getValue: (item: SingleColResponse) => string;
  getLink?: (item: SingleColResponse) => string;
  filterParameter: FilterParameter;
}) {
  const { data, isFetching } = useSingleCol({
    parameter: filterParameter,
  });

  const { data: previousData, isFetching: previousIsFetching } = useSingleCol({
    parameter: filterParameter,
    periodTime: "previous",
  });

  const previousDataMap = useMemo(() => {
    return previousData?.data?.reduce((acc, curr) => {
      acc[getKey(curr)] = curr;
      return acc;
    }, {} as Record<string, SingleColResponse>);
  }, [previousData]);

  const ratio = data?.data?.[0]?.percentage
    ? 100 / data?.data?.[0]?.percentage
    : 1;

  return (
    <Card>
      {isFetching && <CardLoader />}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {data?.data?.slice(0, 10).map((e) => (
          <div
            key={getKey(e)}
            className="relative h-7 flex items-center cursor-pointer hover:bg-neutral-850 group"
            onClick={() =>
              addFilter({
                parameter: filterParameter,
                value: [getValue(e)],
                type: "equals",
              })
            }
          >
            <div
              className="absolute inset-0 bg-fuchsia-400 py-2 opacity-30 rounded-md"
              style={{ width: `${e.percentage * ratio}%` }}
            ></div>
            <div className="z-10 mx-2 flex justify-between items-center text-sm w-full">
              <div className="flex items-center gap-1">
                {getLabel(e)}
                {getLink && (
                  <a
                    href={getLink(e)}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SquareArrowOutUpRight
                      className="w-3 h-3 text-neutral-300 hover:text-neutral-100"
                      strokeWidth={3}
                    />
                  </a>
                )}
              </div>
              <div className="text-sm flex gap-2">
                <div className="hidden group-hover:block text-neutral-400">
                  {round(e.percentage, 1)}%
                </div>
                <div>{formatter(e.count)}</div>
                {/* <div>
                  {previousDataMap?.[getKey(e)]?.percentage ? (
                    <div className="text-sm flex gap-2">
                      <div>
                        {round(
                          e.percentage -
                            (previousDataMap?.[getKey(e)]?.percentage || 0),
                          1
                        )}
                        %
                      </div>
                    </div>
                  ) : null}
                </div> */}
              </div>
            </div>
          </div>
        ))}
        {data?.data?.length && data?.data?.length > 10 ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">View All</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] w-[1000px]">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2 max-h-[90vh] overflow-x-hidden">
                {data?.data?.map((e) => (
                  <div
                    key={getKey(e)}
                    className="relative flex items-center mr-3 cursor-pointer hover:bg-neutral-850 "
                    onClick={() =>
                      addFilter({
                        parameter: filterParameter,
                        value: [getValue(e)],
                        type: "equals",
                      })
                    }
                  >
                    <div
                      className="absolute inset-0 bg-fuchsia-400 py-2 opacity-30 rounded-md"
                      style={{ width: `${e.percentage * ratio}%` }}
                    ></div>
                    <div className="z-10 ml-2 mr-4 flex justify-between items-center text-sm w-full h-7">
                      <div className="flex items-center gap-1">
                        {getLabel(e)}
                        {getLink && (
                          <a
                            href={getLink(e)}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SquareArrowOutUpRight
                              className="w-3 h-3 text-neutral-300 hover:text-neutral-100"
                              strokeWidth={3}
                            />
                          </a>
                        )}
                      </div>
                      <div className="text-sm flex">
                        <div>{e.count.toLocaleString()}</div>
                        <div className="mx-2 bg-neutral-400 w-[1px] rounded-full h-5"></div>
                        <div className="w-10 text-neutral-400">
                          {round(e.percentage, 2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardContent>
    </Card>
  );
}
