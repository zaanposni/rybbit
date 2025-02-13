import { sql } from "../db/postgres/postgres.js";

export const getLiveUsercount = async () => {
  const result = await sql`SELECT COUNT(*) FROM active_sessions`;
  return result[0].count;
};
