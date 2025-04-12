import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { round } from "lodash";
import { AlertCircle, RefreshCcw, SquareArrowOutUpRight } from "lucide-react";
import { ReactNode } from "react";
import { SingleColResponse } from "../../../../../api/analytics/useSingleCol";
import { addFilter, FilterParameter } from "../../../../../lib/store";
import { formatter } from "../../../../../lib/utils";
import { Skeleton } from "./Skeleton";

export const Row = ({
  e,
  ratio,
  getKey,
  getLabel,
  getValue,
  getLink,
  filterParameter,
}: {
  e: SingleColResponse;
  ratio: number;
  getKey: (item: SingleColResponse) => string;
  getLabel: (item: SingleColResponse) => ReactNode;
  getValue: (item: SingleColResponse) => string;
  getLink?: (item: SingleColResponse) => string;
  filterParameter: FilterParameter;
}) => {
  return (
    <div
      key={getKey(e)}
      className="relative h-6 flex items-center cursor-pointer hover:bg-neutral-850 group"
      onClick={() =>
        addFilter({
          parameter: filterParameter,
          value: [getValue(e)],
          type: "equals",
        })
      }
    >
      <div
        className="absolute inset-0 bg-accent-400 py-2 opacity-25 rounded-md"
        style={{ width: `${e.percentage * ratio}%` }}
      ></div>
      <div className="z-10 mx-2 flex justify-between items-center text-xs w-full">
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
        <div className="text-xs flex gap-2">
          <div className="hidden group-hover:block text-neutral-400">
            {round(e.percentage, 1)}%
          </div>
          <div>{formatter(e.count)}</div>
        </div>
      </div>
    </div>
  );
};

interface BaseStandardSectionProps {
  title: string;
  data: { data?: SingleColResponse[] } | undefined;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
  getKey: (item: SingleColResponse) => string;
  getLabel: (item: SingleColResponse) => ReactNode;
  getValue: (item: SingleColResponse) => string;
  getLink?: (item: SingleColResponse) => string;
  countLabel?: string;
  filterParameter: FilterParameter;
}

export function BaseStandardSection({
  title,
  data,
  isFetching,
  error,
  refetch,
  getKey,
  getLabel,
  getValue,
  getLink,
  countLabel,
  filterParameter,
}: BaseStandardSectionProps) {
  // Determine if we're in a loading state
  const isLoading = isFetching;

  const ratio = data?.data?.[0]?.percentage
    ? 100 / data?.data?.[0]?.percentage
    : 1;

  // Check for errors
  const hasError = error;
  const errorMessage =
    error?.message || "An error occurred while fetching data";

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <Skeleton />
      ) : hasError ? (
        <div className="py-6 flex-1 flex flex-col items-center justify-center gap-3 transition-all">
          <AlertCircle className="text-amber-400 w-8 h-8" />
          <div className="text-center">
            <div className="text-neutral-100 font-medium mb-1">
              Failed to load data
            </div>
            <div className="text-sm text-neutral-400 max-w-md mx-auto mb-3">
              {errorMessage}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-neutral-100"
            onClick={() => refetch()}
          >
            <RefreshCcw className="w-3 h-3" /> Try Again
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-row gap-2 justify-between pr-1 text-xs text-neutral-400">
            <div>{title}</div>
            <div>{countLabel || "Sessions"}</div>
          </div>
          {data?.data?.slice(0, 10).map((e) => (
            <Row
              key={getKey(e)}
              e={e}
              ratio={ratio}
              getKey={getKey}
              getLabel={getLabel}
              getValue={getValue}
              getLink={getLink}
              filterParameter={filterParameter}
            />
          ))}
        </>
      )}
      {isLoading ? (
        // Skeleton for "View All" button when loading
        <Button variant="outline" disabled className="opacity-50">
          View All
        </Button>
      ) : !hasError && data?.data?.length && data?.data?.length > 10 ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">View All</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] w-[1000px]">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-2 justify-between pr-20 text-sm text-neutral-400">
                <div>{title}</div>
                <div>{countLabel || "Sessions"}</div>
              </div>
              <div className="flex flex-col gap-2 max-h-[85vh] overflow-x-hidden">
                {data?.data?.map((e) => (
                  <div
                    key={getKey(e)}
                    className="relative flex items-center mr-3 cursor-pointer hover:bg-neutral-850"
                    onClick={() =>
                      addFilter({
                        parameter: filterParameter,
                        value: [getValue(e)],
                        type: "equals",
                      })
                    }
                  >
                    <div
                      className="absolute inset-0 bg-accent-400 py-2 opacity-30 rounded-md"
                      style={{ width: `${e.percentage * ratio}%` }}
                    ></div>
                    <div className="z-10 ml-2 mr-4 flex justify-between items-center text-xs w-full h-6">
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
                      <div className="flex">
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
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
