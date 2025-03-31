import { createClient } from "@clickhouse/client";
import { Session } from "../postgres/types.js";

export const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST,
  database: process.env.CLICKHOUSE_DB,
  password: process.env.CLICKHOUSE_PASSWORD,
});

export const initializeClickhouse = async () => {
  // Create pageviews table
  await clickhouse.exec({
    query: `
      CREATE TABLE IF NOT EXISTS pageviews (
        site_id UInt16,
        timestamp DateTime,
        session_id String,
        user_id String,
        hostname String,
        pathname String,
        querystring String,
        page_title String,
        referrer String,
        browser LowCardinality(String),
        browser_version LowCardinality(String),
        operating_system LowCardinality(String),
        operating_system_version LowCardinality(String),
        language LowCardinality(String),
        country LowCardinality(FixedString(2)),
        iso_3166_2 LowCardinality(String),
        city String,
        latitude Float64,
        longitude Float64,
        screen_width UInt16,
        screen_height UInt16,
        device_type LowCardinality(String),
        type LowCardinality(String) DEFAULT 'pageview',
        event_name String,
        properties String
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (site_id, timestamp)
      `,
  });

  // // Create sessions table
  // await clickhouse.exec({
  //   query: `
  //     CREATE TABLE IF NOT EXISTS sessions (
  //       site_id UInt16,
  //       start_time DateTime,
  //       end_time DateTime,
  //       session_id String,
  //       user_id String,
  //       hostname String,
  //       pathname String,
  //       querystring String,
  //       page_title String,
  //       referrer String,
  //       browser LowCardinality(String),
  //       browser_version LowCardinality(String),
  //       operating_system LowCardinality(String),
  //       operating_system_version LowCardinality(String),
  //       language LowCardinality(String),
  //       country LowCardinality(FixedString(2)),
  //       iso_3166_2 LowCardinality(String),
  //       screen_width UInt16,
  //       screen_height UInt16,
  //       device_type LowCardinality(String),
  //       entry_page String,
  //       exit_page String,
  //       pageviews UInt32,
  //       events UInt32,
  //       utm_source String,
  //       utm_medium String,
  //       utm_campaign String,
  //       utm_term String,
  //       utm_content String
  //     )
  //     ENGINE = MergeTree()
  //     PARTITION BY toYYYYMM(start_time)
  //     ORDER BY (site_id, start_time)
  //   `,
  // });

  await clickhouse.exec({
    query: `
    CREATE TABLE IF NOT EXISTS sessions
    (
        site_id UInt16,
        session_id String,
        session_start DateTime,
        session_end DateTime,
        user_id String,
        pageviews UInt32,
        entry_page String,
        exit_page String,

        hostname String,
        referrer String,
        browser LowCardinality(String),
        browser_version LowCardinality(String),
        operating_system LowCardinality(String),
        operating_system_version LowCardinality(String),
        language LowCardinality(String),
        country LowCardinality(FixedString(2)),
        iso_3166_2 LowCardinality(String),
        screen_width UInt16,
        screen_height UInt16,
        device_type LowCardinality(String),
        -- Version column for ReplacingMergeTree
        version UInt64
    )
    ENGINE = ReplacingMergeTree(version)
    PARTITION BY toYYYYMM(session_start)
    ORDER BY (site_id, session_id);
    `,
  });
  await clickhouse.exec({
    query: `
    CREATE MATERIALIZED VIEW IF NOT EXISTS sessions_mv
    TO sessions
    AS
    SELECT 
        site_id,
        session_id,
        min(timestamp) AS session_start,
        max(timestamp) AS session_end,
        any(user_id) AS user_id,
        countIf(type = 'pageview') AS pageviews,
        argMinIf(pathname, timestamp, type = 'pageview') AS entry_page,
        argMaxIf(pathname, timestamp, type = 'pageview') AS exit_page,

        any(hostname) AS hostname,
        any(referrer) AS referrer,
        any(browser) AS browser,
        any(browser_version) AS browser_version,
        any(operating_system) AS operating_system,
        any(operating_system_version) AS operating_system_version,
        any(language) AS language,
        any(country) AS country,
        any(iso_3166_2) AS iso_3166_2,
        any(screen_width) AS screen_width,
        any(screen_height) AS screen_height,
        any(device_type) AS device_type,
        -- Use the largest timestamp as the 'version'
        max(toUInt64(timestamp)) AS version
    FROM pageviews
    GROUP BY 
        site_id,
        session_id;
    `,
  });
};

// Function to insert session data
export const insertSessions = async (sessions: Session[]) => {
  try {
    await clickhouse.insert({
      table: "sessions",
      values: sessions,
      format: "JSONEachRow",
    });
    return true;
  } catch (error) {
    console.error("Error inserting session:", error);
    return false;
  }
};

export default clickhouse;
