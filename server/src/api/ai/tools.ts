import { tool } from "@langchain/core/tools";
import {
  getLiveUserCountToolSchema,
  getOverviewBucketedToolSchema,
  getOverviewToolSchema,
  getSingleColToolSchema
} from "./toolSchemas.js";
import { fetchLiveUserCount } from "../getLiveUserCount.js";
import { fetchOverview } from "../getOverview.js";
import { fetchOverviewBucketed } from "../getOverviewBucketed.js";
import { fetchSingleCol } from "../getSingleCol.js";

export function generateTools(timezone: string, site: string) {
  const getLiveUserCountTool = tool(
    async () => {
      try {
        return await fetchLiveUserCount(site);
      } catch (error) {
        console.error(error);
        return "Failed to get live user count";
      }
    },
    {
      name: "get_live_user_count",
      description: "Placeholder",
      schema: getLiveUserCountToolSchema,
    }
  );
  const getOverviewTool = tool(
    async (input) => {
      try {
        return await fetchOverview({ ...input, timezone, site });
      } catch (error) {
        console.error(error);
        return "Failed to get overview";
      }
    },
    {
      name: "get_overview",
      description: "Placeholder",
      schema: getOverviewToolSchema,
    }
  );
  const getOverviewBucketedTool = tool(
    async (input) => {
      try {
        return await fetchOverviewBucketed({ ...input, timezone, site });
      } catch (error) {
        console.error(error);
        return "Failed to get overview bucketed";
      }
    },
    {
      name: "get_overview_bucketed",
      description: "Placeholder",
      schema: getOverviewBucketedToolSchema,
    }
  );
  const getSingleColTool = tool(
    async (input) => {
      try {
        return await fetchSingleCol({ ...input, timezone, site });
      } catch (error) {
        console.error(error);
        return "Failed to get single col";
      }
    },
    {
      name: "get_single_col",
      description: "Placeholder",
      schema: getSingleColToolSchema,
    }
  );

  return [getLiveUserCountTool, getOverviewTool, getOverviewBucketedTool, getSingleColTool];
}
