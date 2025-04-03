import { useGetLiveUsercount } from "../../../api/analytics/useLiveUserCount";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import NumberFlow from "@number-flow/react";

export default function LiveUserCount() {
  const { data } = useGetLiveUsercount();

  return (
    <div className="flex items-center gap-[6px] text-base text-neutral-200 cursor-default">
      <div className="flex justify-center">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
        </span>
      </div>

      <Tooltip>
        <TooltipTrigger>
          {
            <NumberFlow
              respectMotionPreference={false}
              value={data?.count ?? 0}
            />
          }
        </TooltipTrigger>
        <TooltipContent>
          <p>Users online in past 5 minutes</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
