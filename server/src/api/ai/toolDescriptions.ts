export const getLiveUserCountToolDescription = "Retrieves the number of active users currently on the site.";

export const getOverviewToolDescription = `Retrieves an overview of website performance metrics. The metrics are:
- users: Number of unique users.
- sessions: Number of sessions.
- pageviews: Number of pageviews.
- pages_per_session: Average number of pages viewed per session.
- session_duration: Average duration of a session.
- bounce_rate: Percentage of sessions with only one pageview.`;

export const getOverviewBucketedToolDescription = `Retrieves a "bucketed" overview of website performance metrics (an array of data grouped by time intervals). The metrics are: 
- time: The starting point of the time interval.
- users: Number of unique users.
- sessions: Number of sessions.
- pageviews: Number of pageviews.
- pages_per_session: Average number of pages viewed per session.
- session_duration: Average duration of a session.
- bounce_rate: Percentage of sessions with only one pageview.`;
