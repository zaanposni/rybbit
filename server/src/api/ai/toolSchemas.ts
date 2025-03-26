import { z } from "zod";
import { DateTime } from "luxon";

// Specify which parameters can/can't be empty in zod schema desc and validation (e.g., filters can be empty string)

// Some typings don't match across frontend and backend
// E.g., frontend can send null for startDate and endDate while backend expects string only
// Everything still works since null is falsy but probably good to fix

// Check if you need to do some post-processing on the return value of each get/fetchMethod() in each tool
// before returning as a string to filter out unnecessary fields

// Include in zod schema description or LLM prompt somewhere that date can be null if user querying all time
// Not sure about this actually; doesn't really match the current string only typing and messes with validation
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format",
  })
  .refine(date => DateTime.fromISO(date).isValid, {
    message: "Date must be a valid calendar date",
  });

const startDateSchema = dateSchema
  .describe("The start date of the time interval for querying metrics in YYYY-MM-DD format");

const endDateSchema = dateSchema
  .describe("The end date of the time interval for querying metrics in YYYY-MM-DD format");

// describe sql operator mapping? might be unnecessary if filterSchema has description describing field relationships
// since value is typed as string only
// maybe add a description that restricts it to equals or not_equals and contains or not_contains
// based off the filerParameterSchema value
const filterTypeSchema = z.enum(["equals", "not_equals", "contains", "not_contains"])
  .describe("The type of comparison to perform");

const filterParameterSchema = z.enum([
  "browser", // small set
  "operating_system", // small set
  "language", // large set
  "country", // large set
  "device_type", // small set
  "referrer", // infinite set (depends on user input)
  "pathname", // infinite set (depends on user input)
  "page_title", // infinite set (depends on user input)
  "querystring", // infinite set (depends on user input)
  "iso_3166_2", // large set
  "event_name", // infinite set (depends on user input)
  "entry_page", // infinite set (depends on user input)
  "exit_page", // infinite set (depends on user input)
  "dimensions", // infinite set (depends on user input)
]);

// value corresponds to possible values of the parameter field which corresponds to a clickhouse column
// if value array contains multiple values, the filter type comparison is applied to each value in an OR manner
// need to add a description/schema for value that specifies which values it can take depending on the parameter
// can be list of literals for parameters with small set of possible values like operating_system, browser, device_type, etc.
// specify general identifier for parameters with large value set like country, iso_3166, language, etc. (various ISO standards)
// sometimes value can depend on the user input (e.g., referrer if user asks "how many visits do I have from google.com")
// describe overall purpose of a single filter object and field relationships
// describe the order in which the LLM should think through choosing? (parameter, type, value order?)
const filterSchema = z.object({
  parameter: filterParameterSchema,
  value: z.array(z.string()).nonempty({ message: "Filter values must contain at least one string" }),
  type: filterTypeSchema,
});

// If JSON string of array contains multiple elements, each filter is applied in an AND manner
const filtersSchema = z.string()
  .refine((filters) => {
    try {
      const parsed = JSON.parse(filters);
      if (!Array.isArray(parsed)) return false;
      parsed.forEach((filter: any) => filterSchema.parse(filter));
      return true;
    } catch (error) {
      return false;
    }
  }, {
    message: "Filters must be a JSON string representing an array of filter objects."
  });

const bucketSchema = z.string().describe("Placeholder");

const past24HoursSchema = z.boolean()
  .describe("Determines whether the query uses the past 24 hours or the startDate and endDate");

// have some sort of default value if user doesn't say something like "give me top 5, most visited (implies 1), etc."
// think the value (default or not) has to be returned by the LLM no matter what
// maybe just let LLM decide on a value if user doesn't specify instead of hardcoding a default value
// so include something about this in tool and/or parameter descriptions and/or LLM prompt
const limitSchema = z.number().describe("Placeholder");

// similar situation to limit for getSingleColTool (LLM decides based off user input)
// except getSessionsTool can be called multiple times in parallel where each tool call is related to each other
// related as in the page for each tool call has to be consecutive starting from 1
const pageSchema = z.number().describe("Placeholder");

// pass site at runtime
export const getLiveUserCountToolSchema = z.object({});

// pass timezone and site at runtime
export const getOverviewToolSchema = z.object({
  startDate: startDateSchema,
  endDate: endDateSchema,
  filters: filtersSchema,
  past24Hours: past24HoursSchema,
});

// pass timezone and site at runtime
export const getOverviewBucketedToolSchema = z.object({
  startDate: startDateSchema,
  endDate: endDateSchema,
  bucket: bucketSchema,
  filters: filtersSchema,
  past24Hours: past24HoursSchema,
});

// pass timezone and site at runtime
export const getSingleColToolSchema = z.object({
  startDate: startDateSchema,
  endDate: endDateSchema,
  filters: filtersSchema,
  parameter: filterParameterSchema,
  limit: limitSchema,
});

// pass timezone and site at runtime
export const getSessionsToolSchema = z.object({
  startDate: startDateSchema,
  endDate: endDateSchema,
  filters: filtersSchema,
  page: pageSchema,
});

// pass timezone and site at runtime
// this tool requires more than one LLM/tool call cycle because it needs userId's
// which can't be provided by the user from a message and can't be generated by the LLM
// so either you get the LLM to call this tool again after calling getSessionsTool (gets userId's)
// which adds an input output cycle (don't think this is the best method; last method is similar and better)
// or add additional logic (sql query?) in the tool to fetch userId's from the database to pass at run time
// the tool only accepts one userId at a time though so you'll need to decide how many userId's to fetch (LLM)
// or maybe just call fetchSessions() (need to decide how many times to call) in this tool too
// maybe add a parameter similar to page that determines how many times to call fetchSessions()
// this parameter is determined by the LLM based off user input like limit and page
// or maybe both methods could be used/needed depending on the nature of the user query
// I think there's a high chance it actually just depends on what kind of query the user asks for
// Cause maybe you need the general sessions data to determine which user(s) to fetch detailed sessions data for
// Might need another tool that wraps this one to be able to call this tool multiple times in parallel
// without losing any context (parallel LLM tool calls are unaware of each other)
export const getUserSessionsToolSchema = z.object({
  startDate: startDateSchema,
  endDate: endDateSchema,
  filters: filtersSchema,
});
