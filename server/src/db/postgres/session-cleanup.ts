import { sql } from "./postgres.js";

// function convertPostgresToClickhouse(postgresTimestamp: string): string {
//   console.log("Parsing timestamp:", postgresTimestamp);
//   const dateTime = DateTime.fromISO(postgresTimestamp, {
//     zone: "utc",
//   });
//   if (!dateTime.isValid) {
//     console.error("Invalid timestamp:", postgresTimestamp);
//     console.error("Reason:", dateTime.invalidReason);
//     throw new Error("Invalid timestamp format");
//   }
//   return dateTime.toFormat("yyyy-MM-dd HH:mm:ss");
// }

// luxon is not working, so we need to use this
function convertPostgresToClickhouse(postgresTimestamp: string): string {
  try {
    const date = new Date(postgresTimestamp);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid Date");
    }
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error parsing timestamp:", postgresTimestamp, error);
    throw new Error("Invalid timestamp format");
  }
}

export async function cleanupOldSessions() {
  const deletedSessions = await sql`
    DELETE FROM active_sessions 
    WHERE last_activity < NOW() - INTERVAL '30 minute'
    RETURNING *
  `;

  // console.log(`Cleaned up ${deletedSessions.length} sessions`)
}
