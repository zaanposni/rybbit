import { createClient } from "@clickhouse/client";
import { Session } from "../postgres/types.js";

export const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST,
  database: process.env.CLICKHOUSE_DB,
});

export const initializeClickhouse = async () => {
  // Create pageviews table
  await clickhouse.exec({
    query: `
      CREATE TABLE IF NOT EXISTS pageviews (
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
        country LowCardinality(String),
        screen_width UInt16,
        screen_height UInt16,
        device_type LowCardinality(String)
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (timestamp, session_id)
    `,
  });

  // Create sessions table
  await clickhouse.exec({
    query: `
      CREATE TABLE IF NOT EXISTS sessions (
        hostname String,
        session_id String,
        start_time DateTime,
        end_time DateTime,
        entry_page String,
        exit_page String,
        pageviews UInt32,
        events UInt32,
        duration UInt32,
        referrer String,
        ip_address String,
        browser String,
        language String,
        country LowCardinality(String)
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(start_time)
      ORDER BY (session_id, start_time)
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
