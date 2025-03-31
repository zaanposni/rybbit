import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../db/clickhouse/clickhouse.js";
import {
  getFilterStatement,
  getTimeStatement,
  processResults,
} from "./utils.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";

type TimeBucket = "hour" | "day" | "week" | "month";

interface GetOverviewBucketedRequest {
  Querystring: {
    startDate: string;
    endDate: string;
    timezone: string;
    bucket: TimeBucket;
    site: string;
    filters: string;
    past24Hours?: boolean;
  };
}

type GetOverviewBucketedResponse = {
  time: string;
  pageviews: number;
  sessions: number;
  pages_per_session: number;
  bounce_rate: number;
  session_duration: number;
  users: number;
}[];

const TimeBucketToFn = {
  minute: "toStartOfMinute",
  five_minutes: "toStartOfFiveMinutes",
  ten_minutes: "toStartOfTenMinutes",
  fifteen_minutes: "toStartOfFifteenMinutes",
  hour: "toStartOfHour",
  day: "toStartOfDay",
  week: "toStartOfWeek",
  month: "toStartOfMonth",
  year: "toStartOfYear",
};

const bucketIntervalMap = {
  minute: "1 MINUTE",
  five_minutes: "5 MINUTES",
  ten_minutes: "10 MINUTES",
  fifteen_minutes: "15 MINUTES",
  hour: "1 HOUR",
  day: "1 DAY",
  week: "7 DAY",
  month: "1 MONTH",
  year: "1 YEAR",
} as const;

function getTimeStatementFill(
  startDate: string,
  endDate: string,
  timezone: string,
  bucket: TimeBucket
) {
  return `WITH FILL FROM toTimeZone(
      toStartOfDay(toDateTime('${startDate}', '${timezone}')),
      'UTC'
    )
    TO if(
      toDate('${endDate}') = toDate(now(), '${timezone}'),
      now(),
      toTimeZone(
        toStartOfDay(toDateTime('${endDate}', '${timezone}')) + INTERVAL 1 DAY,
        'UTC'
      )
    ) STEP INTERVAL ${bucketIntervalMap[bucket]}`;
}

const getQuery = ({
  startDate,
  endDate,
  timezone,
  bucket,
  site,
  filters,
  past24Hours,
}: GetOverviewBucketedRequest["Querystring"]) => {
  const filterStatement = getFilterStatement(filters);

  if (past24Hours) {
    return `SELECT
    session_stats.time AS time,
    session_stats.sessions,
    session_stats.pages_per_session,
    session_stats.bounce_rate * 100 AS bounce_rate,
    session_stats.session_duration,
    page_stats.pageviews,
    page_stats.users
FROM
(
    /* ————— SESSION STATS ————— */
    SELECT
        ${TimeBucketToFn[bucket]}(toTimeZone(start_time, '${timezone}')) AS time,
        COUNT() AS sessions,
        AVG(pages_in_session) AS pages_per_session,
        sumIf(1, pages_in_session = 1) / COUNT() AS bounce_rate,
        AVG(end_time - start_time) AS session_duration
    FROM
    (
        /* One row per session */
        SELECT
            session_id,
            MIN(timestamp) AS start_time,
            MAX(timestamp) AS end_time,
            COUNT(*) AS pages_in_session
        FROM pageviews
        WHERE
            site_id = ${site}
            ${filterStatement}
            AND timestamp >= toTimeZone(now('${timezone}'), 'UTC') - INTERVAL 1 DAY
            AND timestamp < toTimeZone(now('${timezone}'), 'UTC')
            AND type = 'pageview'
        GROUP BY session_id
    )
    GROUP BY time
    ORDER BY time WITH FILL
      FROM toTimeZone(${TimeBucketToFn[bucket]}(now('${timezone}') - INTERVAL 1 DAY), 'UTC')
      TO   toTimeZone(${TimeBucketToFn[bucket]}(now('${timezone}')), 'UTC')
      STEP INTERVAL 1 HOUR
) AS session_stats

FULL JOIN
(
    /* ————— PAGE STATS ————— */
    SELECT
        ${TimeBucketToFn[bucket]}(toTimeZone(timestamp, '${timezone}')) AS time,
        COUNT(*) AS pageviews,
        COUNT(DISTINCT user_id) AS users
    FROM pageviews
    WHERE
        site_id = ${site}
        ${filterStatement}
        AND timestamp >= toTimeZone(now('${timezone}'), 'UTC') - INTERVAL 1 DAY
        AND timestamp < toTimeZone(now('${timezone}'), 'UTC')
        AND type = 'pageview'
    GROUP BY time
    ORDER BY time WITH FILL
      FROM toTimeZone(${TimeBucketToFn[bucket]}(now('${timezone}') - INTERVAL 1 DAY), 'UTC')
      TO   toTimeZone(${TimeBucketToFn[bucket]}(now('${timezone}')), 'UTC')
      STEP INTERVAL 1 HOUR
) AS page_stats

USING time
ORDER BY time;`;
  }
  const isAllTime = !startDate && !endDate;

  const query = `SELECT
    session_stats.time AS time,
    session_stats.sessions,
    session_stats.pages_per_session,
    session_stats.bounce_rate * 100 AS bounce_rate,
    session_stats.session_duration,
    page_stats.pageviews,
    page_stats.users
FROM
(
    SELECT
         ${
           TimeBucketToFn[bucket]
         }(toTimeZone(start_time, '${timezone}')) AS time,
        COUNT() AS sessions,
        AVG(pages_in_session) AS pages_per_session,
        sumIf(1, pages_in_session = 1) / COUNT() AS bounce_rate,
        AVG(end_time - start_time) AS session_duration
    FROM
    (
        /* One row per session */
        SELECT
            session_id,
            MIN(timestamp) AS start_time,
            MAX(timestamp) AS end_time,
            COUNT(*) AS pages_in_session
        FROM pageviews
        WHERE 
            site_id = ${site}
            ${filterStatement}
            ${getTimeStatement(startDate, endDate, timezone)}
            AND type = 'pageview'
        GROUP BY session_id
    )
    GROUP BY time ORDER BY time ${
      isAllTime
        ? ""
        : getTimeStatementFill(startDate, endDate, timezone, bucket)
    }
) AS session_stats
FULL JOIN
(
    SELECT
         ${
           TimeBucketToFn[bucket]
         }(toTimeZone(timestamp, '${timezone}')) AS time,
        COUNT(*) AS pageviews,
        COUNT(DISTINCT user_id) AS users
    FROM pageviews
    WHERE
        site_id = ${site}
        ${filterStatement}
        ${getTimeStatement(startDate, endDate, timezone)}
        AND type = 'pageview'
    GROUP BY time ORDER BY time ${
      isAllTime
        ? ""
        : getTimeStatementFill(startDate, endDate, timezone, bucket)
    }
) AS page_stats
USING time
ORDER BY time`;

  return query;
};

export async function fetchOverviewBucketed({
  startDate,
  endDate,
  timezone,
  bucket,
  site,
  filters,
  past24Hours,
}: GetOverviewBucketedRequest["Querystring"]) {
  const query = getQuery({
    startDate,
    endDate,
    timezone,
    bucket,
    site,
    filters,
    past24Hours: past24Hours ?? false,
  });

  try {
    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
    });

    return await processResults<GetOverviewBucketedResponse[number]>(result);
  } catch (error) {
    console.error("Error fetching pageviews:", error);
    return null;
  }
}

export async function getOverviewBucketed(
  req: FastifyRequest<GetOverviewBucketedRequest>,
  res: FastifyReply
) {
  const { startDate, endDate, timezone, bucket, site, filters, past24Hours } =
    req.query;

  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  const data = await fetchOverviewBucketed({
    startDate,
    endDate,
    timezone,
    bucket,
    site,
    filters,
    past24Hours,
  });
  if (!data) {
    return res.status(500).send({ error: "Failed to fetch pageviews" });
  }

  return res.send({ data });
}
