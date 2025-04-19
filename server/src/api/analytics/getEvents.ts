import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../../db/clickhouse/clickhouse.js";
import { processResults } from "./utils.js";
import { getUserHasAccessToSitePublic } from "../../lib/auth-utils.js";

export type GetEventsResponse = {
  timestamp: string;
  event_name: string;
  properties: string;
  user_id: string;
  pathname: string;
  querystring: string;
  hostname: string;
  referrer: string;
  browser: string;
  operating_system: string;
  country: string;
  device_type: string;
  type: string;
  page_title: string;
}[];

interface GetEventsRequest {
  Params: {
    site: string;
  };
  Querystring: {
    count?: string;
  };
}

export async function getEvents(
  req: FastifyRequest<GetEventsRequest>,
  res: FastifyReply
) {
  const { site } = req.params;
  const { count = "10" } = req.query;

  const userHasAccessToSite = await getUserHasAccessToSitePublic(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  const limitCount = parseInt(count, 10);

  try {
    const query = await clickhouse.query({
      query: `
        SELECT
          timestamp,
          event_name,
          properties,
          user_id,
          pathname,
          querystring,
          hostname,
          page_title,
          referrer,
          browser,
          operating_system,
          country,
          device_type,
          type
        FROM events
        WHERE
          site_id = {siteId:Int32}
          AND (type = 'custom_event' OR type = 'pageview')
          AND timestamp > now() - INTERVAL 30 MINUTE
        ORDER BY timestamp DESC
        LIMIT {limit:Int32}
      `,
      format: "JSONEachRow",
      query_params: {
        siteId: Number(site),
        limit: Number(limitCount),
      },
    });

    const events = await processResults<GetEventsResponse[number]>(query);

    return res.send({ data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).send({ error: "Failed to fetch events" });
  }
}
