import { sql } from "../db/postgres/postgres.js";
import { initAuth } from "./auth.js";
import dotenv from "dotenv";

dotenv.config();

export let allowList: string[] = [];

export const loadAllowedDomains = async () => {
  const domains = await sql`SELECT domain FROM sites`;
  allowList = [
    "http://localhost:3002",
    process.env.BASE_URL || "",
    ...domains.map(({ domain }) => `https://${domain}`),
  ];
  initAuth(allowList);
};
