import { siteConfig } from "./lib/siteConfig.js";

export function getDeviceType(
  screenWidth: number,
  screenHeight: number,
  ua: UAParser.IResult
): string {
  // if (ua.device) {
  //   if (ua.device.type === "mobile") {
  //     return "Mobile";
  //   } else if (ua.device.type === "tablet") {
  //     return "Tablet";
  //   } else if (ua.device.type === "console") {
  //     return "Console";
  //   } else if (ua.device.type === "smarttv") {
  //     return "TV";
  //   } else if (ua.device.type === "wearable") {
  //     return "Wearable";
  //   } else if (ua.device.type === "embedded") {
  //     return "Embedded";
  //   } else if (ua.device.type === "xr") {
  //     return "XR";
  //   }
  // }

  // if (ua.os.name) {
  //   if (desktopOS.has(ua.os.name)) {
  //     return "Desktop";
  //   } else if (mobileOS.has(ua.os.name)) {
  //     return "Mobile";
  //   } else if (tvOS.has(ua.os.name)) {
  //     return "TV";
  //   } else if (gamingOS.has(ua.os.name)) {
  //     return "Console";
  //   }
  // }

  const largerDimension = Math.max(screenWidth, screenHeight);
  const smallerDimension = Math.min(screenWidth, screenHeight);
  if (largerDimension > 1024) {
    return "Desktop";
  } else if (largerDimension > 768 && smallerDimension > 1024) {
    return "Tablet";
  }
  return "Mobile";
}

// Check if a site is public
export const isSitePublic = async (siteId: string | number) => {
  try {
    // Ensure the siteConfig cache is initialized
    await siteConfig.ensureInitialized();

    // Use the cached value
    return siteConfig.isSitePublic(siteId);
  } catch (err) {
    console.error("Error checking if site is public:", err);
    return false;
  }
};

// Extract site ID from path
export const extractSiteId = (path: string) => {
  // Remove query parameters if present
  const pathWithoutQuery = path.split("?")[0];

  // Handle route patterns:
  // /route/:site
  // /route/:sessionId/:site
  // /route/:userId/:site
  const segments = pathWithoutQuery.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return segments[segments.length - 1];
  }
  return null;
};

export const normalizeOrigin = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    console.info({
      before: hostname,
      after: hostname.replace(/^www\./, ""),
    });
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
