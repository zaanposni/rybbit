import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../db/clickhouse/clickhouse.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";
import { processResults } from "./utils.js";

// Define the expected shape of a single data row from the query
interface RetentionDataRow {
  cohort_period: string;
  period_difference: number;
  cohort_size: number;
  retained_users: number;
  retention_percentage: number;
}

// Processed data structure for the frontend
interface ProcessedRetentionData {
  cohorts: Record<string, { size: number; percentages: (number | null)[] }>;
  maxPeriods: number;
  mode: "day" | "week";
}

export const getRetention = async (
  req: FastifyRequest<{
    Params: { site: string };
    Querystring: { mode?: string };
  }>,
  res: FastifyReply
) => {
  const { site } = req.params;
  const { mode = "week" } = req.query; // Default to weekly mode

  // Validate mode parameter
  const retentionMode = mode === "day" ? "day" : "week";

  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  // Build the appropriate SQL based on the retention mode
  const periodFunction = retentionMode === "day" ? "toDate" : "toStartOfWeek";
  const periodDiffFunc = retentionMode === "day" ? "day" : "week";

  const query = await clickhouse.query({
    query: `
WITH UserFirstPeriod AS (
    SELECT
        user_id,
        ${periodFunction}(min(timestamp)${
      retentionMode === "week" ? ", 1" : ""
    }) AS cohort_period
    FROM pageviews
    WHERE site_id = {siteId:UInt16}
    -- AND timestamp >= today() - INTERVAL 90 DAY
    GROUP BY user_id
),
PeriodActivity AS (
    SELECT DISTINCT
        user_id,
        ${periodFunction}(timestamp${
      retentionMode === "week" ? ", 1" : ""
    }) AS activity_period
    FROM pageviews
    WHERE site_id = {siteId:UInt16}
    -- AND timestamp >= today() - INTERVAL 90 DAY
),
CohortRetention AS (
    SELECT
        ufp.cohort_period,
        dateDiff('${periodDiffFunc}', ufp.cohort_period, pa.activity_period) AS period_difference,
        count(DISTINCT pa.user_id) AS retained_users
    FROM UserFirstPeriod ufp
    JOIN PeriodActivity pa ON ufp.user_id = pa.user_id
    WHERE pa.activity_period >= ufp.cohort_period
    GROUP BY
        ufp.cohort_period,
        period_difference
),
CohortSize AS (
    SELECT
        cohort_period,
        count(DISTINCT user_id) AS total_users
    FROM UserFirstPeriod
    GROUP BY cohort_period
)
SELECT
    cr.cohort_period,
    cr.period_difference,
    cs.total_users AS cohort_size,
    cr.retained_users,
    round(cr.retained_users * 100.0 / cs.total_users, 2) AS retention_percentage
FROM CohortRetention cr
JOIN CohortSize cs ON cr.cohort_period = cs.cohort_period
ORDER BY
    cr.cohort_period DESC,
    cr.period_difference ASC;
    `,
    format: "JSONEachRow",
    query_params: {
      siteId: Number(site),
    },
  });

  const results = await processResults<RetentionDataRow>(query);

  // Process data into a grid-friendly format
  const processedData: ProcessedRetentionData = {
    ...processRetentionData(results),
    mode: retentionMode as "day" | "week",
  };

  return res.send({ data: processedData });
};

// Process raw retention data into a grid-friendly format
function processRetentionData(
  rawData: RetentionDataRow[]
): Omit<ProcessedRetentionData, "mode"> {
  if (!rawData || rawData.length === 0) {
    return { cohorts: {}, maxPeriods: 0 };
  }

  const processedCohorts: Record<
    string,
    { size: number; percentages: (number | null)[] }
  > = {};
  let maxPeriodDiff = 0;

  rawData.forEach((row) => {
    if (!processedCohorts[row.cohort_period]) {
      processedCohorts[row.cohort_period] = {
        size: row.cohort_size,
        percentages: [],
      };
    }
    // Ensure array is long enough, filling gaps with null
    while (
      processedCohorts[row.cohort_period].percentages.length <=
      row.period_difference
    ) {
      processedCohorts[row.cohort_period].percentages.push(null);
    }
    processedCohorts[row.cohort_period].percentages[row.period_difference] =
      row.retention_percentage;

    if (row.period_difference > maxPeriodDiff) {
      maxPeriodDiff = row.period_difference;
    }
  });

  // Ensure all percentage arrays have the same length for grid alignment
  Object.values(processedCohorts).forEach((cohort) => {
    while (cohort.percentages.length <= maxPeriodDiff) {
      cohort.percentages.push(null);
    }
  });

  return { cohorts: processedCohorts, maxPeriods: maxPeriodDiff };
}
