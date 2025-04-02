import { ResultSet } from "@clickhouse/client";
import { Filter, FilterParameter, FilterType } from "./types.js";

export function getTimeStatement({
  date,
  pastMinutes,
}: {
  date?: {
    startDate: string;
    endDate: string;
    timezone: string;
    table?: "events" | "sessions";
  };
  pastMinutes?: number;
}) {
  if (date) {
    const { startDate, endDate, timezone, table } = date;
    if (!startDate && !endDate) {
      return "";
    }

    const col = (table ?? "events") === "events" ? "timestamp" : "session_end";

    return `AND ${col} >= toTimeZone(
      toStartOfDay(toDateTime('${startDate}', '${timezone}')),
      'UTC'
      )
      AND ${col} < if(
        toDate('${endDate}') = toDate(now(), '${timezone}'),
        now(),
        toTimeZone(
          toStartOfDay(toDateTime('${endDate}', '${timezone}')) + INTERVAL 1 DAY,
          'UTC'
        )
      )`;
  }
  if (pastMinutes) {
    return `AND timestamp > now() - interval '${pastMinutes} minute'`;
  }
}

export async function processResults<T>(
  results: ResultSet<"JSONEachRow">
): Promise<T[]> {
  const data: T[] = await results.json();
  for (const row of data) {
    for (const key in row) {
      if (!isNaN(Number(row[key])) && row[key] !== "") {
        row[key] = Number(row[key]) as any;
      }
    }
  }
  return data;
}

const filterTypeToOperator = (type: FilterType) => {
  switch (type) {
    case "equals":
      return "=";
    case "not_equals":
      return "!=";
    case "contains":
      return "LIKE";
    case "not_contains":
      return "NOT LIKE";
  }
};

export const geSqlParam = (parameter: FilterParameter) => {
  if (parameter === "referrer") {
    return "domainWithoutWWW(referrer)";
  }
  if (parameter === "entry_page") {
    return "(SELECT argMin(pathname, timestamp) FROM pageviews WHERE session_id = pageviews.session_id)";
  }
  if (parameter === "exit_page") {
    return "(SELECT argMax(pathname, timestamp) FROM pageviews WHERE session_id = pageviews.session_id)";
  }
  if (parameter === "dimensions") {
    return "concat(toString(screen_width), 'x', toString(screen_height))";
  }
  return parameter;
};

export function getFilterStatement(filters: string) {
  if (!filters) {
    return "";
  }
  const filtersArray = JSON.parse(filters);
  if (filtersArray.length === 0) {
    return "";
  }
  return (
    "AND " +
    filtersArray
      .map((filter: Filter) => {
        const x =
          filter.type === "contains" || filter.type === "not_contains"
            ? "%"
            : "";

        if (filter.parameter === "entry_page") {
          if (filter.value.length === 1) {
            return `session_id IN (
              SELECT session_id 
              FROM (
                SELECT 
                  session_id, 
                  argMin(pathname, timestamp) AS entry_pathname
                FROM pageviews 
                GROUP BY session_id
              ) 
              WHERE entry_pathname ${filterTypeToOperator(filter.type)} '${x}${
              filter.value[0]
            }${x}'
            )`;
          }

          const valuesWithOperator = filter.value.map(
            (value) =>
              `entry_pathname ${filterTypeToOperator(
                filter.type
              )} '${x}${value}${x}'`
          );

          return `session_id IN (
            SELECT session_id 
            FROM (
              SELECT 
                session_id, 
                argMin(pathname, timestamp) AS entry_pathname
              FROM pageviews 
              GROUP BY session_id
            ) 
            WHERE (${valuesWithOperator.join(" OR ")})
          )`;
        }

        if (filter.parameter === "exit_page") {
          if (filter.value.length === 1) {
            return `session_id IN (
              SELECT session_id 
              FROM (
                SELECT 
                  session_id, 
                  argMax(pathname, timestamp) AS exit_pathname
                FROM pageviews 
                GROUP BY session_id
              ) 
              WHERE exit_pathname ${filterTypeToOperator(filter.type)} '${x}${
              filter.value[0]
            }${x}'
            )`;
          }

          const valuesWithOperator = filter.value.map(
            (value) =>
              `exit_pathname ${filterTypeToOperator(
                filter.type
              )} '${x}${value}${x}'`
          );

          return `session_id IN (
            SELECT session_id 
            FROM (
              SELECT 
                session_id, 
                argMax(pathname, timestamp) AS exit_pathname
              FROM pageviews 
              GROUP BY session_id
            ) 
            WHERE (${valuesWithOperator.join(" OR ")})
          )`;
        }

        if (filter.value.length === 1) {
          return `${geSqlParam(filter.parameter)} ${filterTypeToOperator(
            filter.type
          )} '${x}${filter.value[0]}${x}'`;
        }

        const valuesWithOperator = filter.value.map(
          (value) =>
            `${geSqlParam(filter.parameter)} ${filterTypeToOperator(
              filter.type
            )} '${x}${value}${x}'`
        );

        return `(${valuesWithOperator.join(" OR ")})`;
      })
      .join(" AND ")
  );
}
