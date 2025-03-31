import { tool } from "@langchain/core/tools";
import {
  getLiveUserCountToolDescription,
  getOverviewBucketedToolDescription,
  getOverviewToolDescription
} from "./toolDescriptions.js";
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
        const result = await fetchLiveUserCount(site);
        return result.toString();
      } catch (error) {
        console.error(error);
        return "Failed to get live user count";
      }
    },
    {
      name: "get_live_user_count",
      description: getLiveUserCountToolDescription,
      schema: getLiveUserCountToolSchema,
    }
  );
  const getOverviewTool = tool(
    async (input) => {
      try {
        const result = await fetchOverview({ ...input, timezone, site });
        return JSON.stringify(result);
      } catch (error) {
        console.error(error);
        return "Failed to get overview";
      }
    },
    {
      name: "get_overview",
      description: getOverviewToolDescription,
      schema: getOverviewToolSchema,
    }
  );
  const getOverviewBucketedTool = tool(
    async (input) => {
      try {
        const result = await fetchOverviewBucketed({ ...input, timezone, site });
        return JSON.stringify(result);
      } catch (error) {
        console.error(error);
        return "Failed to get overview bucketed";
      }
    },
    {
      name: "get_overview_bucketed",
      description: getOverviewBucketedToolDescription,
      schema: getOverviewBucketedToolSchema,
    }
  );
  const getSingleColTool = tool(
    async (input) => {
      try {
        const result = await fetchSingleCol({ ...input, timezone, site });
        return JSON.stringify(result);
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
