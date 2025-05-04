import { db, sql } from "../db/postgres/postgres.js";
import { sites } from "../db/postgres/schema.js";
import { normalizeOrigin } from "../utils.js";
import { initAuth } from "./auth.js";
import dotenv from "dotenv";

dotenv.config();

export let allowList: string[] = [];

export const loadAllowedDomains = async () => {
  try {
    // Check if the sites table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sites'
      );
    `;

    // Only query the sites table if it exists
    let domains: { domain: string }[] = [];
    if (tableExists[0].exists) {
      // Use Drizzle to get domains
      const sitesData = await db.select({ domain: sites.domain }).from(sites);
      domains = sitesData;
    }

    allowList = [
      "localhost:3002",
      normalizeOrigin(process.env.BASE_URL || ""),
      ...domains.map(({ domain }) => domain),
    ];
    initAuth(allowList);
  } catch (error) {
    console.error("Error loading allowed domains:", error);
    // Set default values in case of error
    allowList = ["localhost:3002", normalizeOrigin(process.env.BASE_URL || "")];
    initAuth(allowList);
  }
};
