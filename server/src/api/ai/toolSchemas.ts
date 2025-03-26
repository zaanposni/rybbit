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

const filterParameterSchema = z.enum([
  "browser",
  "operating_system",
  "device_type",
  "dimensions",
  "language",
  "country",
  "iso_3166_2",
  "referrer",
  "pathname",
  "querystring",
  "page_title",
  "event_name",
  "entry_page",
  "exit_page",
]);

// describe sql operator mapping? might be unnecessary if filterSchema has description describing field relationships
// since value is typed as string only
// maybe add a description that restricts it to equals or not_equals and contains or not_contains
// based off the filerParameterSchema value
const filterTypeSchema = z.enum(["equals", "not_equals", "contains", "not_contains"])
  .describe("The type of comparison to perform");

const filterValueSchema = z.array(z.string())
  .nonempty({ message: "Filter values must contain at least one string" })
  .describe(`An array of one or more string values to match against the given parameter. These values are used to filter the records. If there is only one value, the filter produces a single condition. If there are multiple values, they are combined using the OR operator to allow matching any of the provided values.

The allowable values for each possible parameter are described below.

- browser:
    - Description: A string extracted from the User-Agent header representing the browser name.
    - Examples: "Chrome", "Safari", "Edge", "Firefox".
- operating_system:
    - Description: A string representing the operating system from the User-Agent header.
    - Examples: "Windows", "macOS", "Linux", "Android", "iOS".
- device_type:
    - Description: A string that indicates the type of device accessing the site.
    - Allowed Values: "Desktop", "Mobile", or "Tablet".
    - Notes: This is a closed set, so only these three values are acceptable.
- dimensions:
    - Description: A string representing the display resolution in the format "widthxheight".
    - Examples: "1920x1080", "1366x768".
- language:
    - Description: A string conforming to IETF BCP 47 language tags.
    - Examples: "en-US", "en-GB", "fr-FR", or simply "en", "fr" if the region subtag is missing.
    - Notes: The language subtag (e.g., "en", "fr") is always present, while the region subtag (e.g., "US", "GB") may be omitted if necessary.
- country:
    - Description: A string representing an ISO 3166-1 alpha-2 country code.
    - Examples: "US", "CA", "GB", "FR".
    - Notes: This standard ensures that only valid two-letter country codes are accepted.
- iso_3166_2:
    - Description: A string representing an ISO 3166-2 code for country subdivisions.
    - Examples: "US-CA" (for California), "FR-IDF" (for Île-de-France).
    - Notes: This value follows a standardized format with a country code and a subdivision code separated by a hyphen.
- referrer:
    - Description: A string containing the URL returned by JavaScript's document.referrer.
    - Examples: "https://google.com/", "https://reddit.com/".
    - Notes: Since the referrer can be any valid URL, this value can be highly varied; typically, only the domain or full URL is used.
- pathname:
    - Description: A string representing the path portion of a URL, as returned by JavaScript's URL.pathname.
    - Examples: "/home", "/about", "/products/item-123".
    - Notes: This excludes the domain and query string, focusing only on the path structure.
- querystring:
    - Description: A string representing the query portion of a URL, as returned by JavaScript's URL.search.
    - Examples: "?q=search+term", "?page=2&sort=asc".
    - Notes: This includes the leading "?" and contains key-value pairs.
- page_title:
    - Description: A string representing the document title, as provided by JavaScript's document.title.
    - Examples: "Welcome to Our Site", "Product Details", "Contact Us".
    - Notes: This is typically a free-form text string that describes the page content.
- event_name:
    - Description: A custom string defined by the user, representing the name of an event.
    - Examples: "button_click", "form_submit", "video_play".
    - Notes: This is free-form text and may vary widely depending on the specific events being tracked.
- entry_page:
    - Description: A string representing the path portion of the URL where a session begins, extracted from the first pageview in a session.
    - Examples: "/landing", "/homepage".
    - Notes: It uses the same format as pathname but specifically denotes the entry point of the session.
- exit_page:
    - Description: A string representing the path portion of the URL where a session ends, extracted from the last pageview in a session.
    - Examples: "/checkout", "/thank-you".
    - Notes: Like entry_page, it follows the pathname structure but indicates the session's end page.`);

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
  type: filterTypeSchema,
  value: filterValueSchema,
});

// If JSON string of array contains multiple elements, each filter is applied in an AND manner
// filtersSchema can be empty string "" or empty array "[]" based off getFilterStatement guards
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
