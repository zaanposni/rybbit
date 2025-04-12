import { FastifyRequest } from "fastify";
import crypto from "crypto";
import { db } from "./db/postgres/postgres.js";
import { sites } from "./db/postgres/schema.js";
import { eq } from "drizzle-orm";
import { publicSites } from "./lib/publicSites.js";

export function getUserId(ip: string, userAgent: string) {
  return crypto
    .createHash("sha256")
    .update(ip + userAgent)
    .digest("hex");
}

export const desktopOS = new Set([
  "Windows",
  "macOS",
  "Linux",
  "Ubuntu",
  "Fedora",
  "Debian",
  "Mint",
  "Arch",
  "CentOS",
  "elementary OS",
  "Gentoo",
  "Kubuntu",
  "Manjaro",
  "RedHat",
  "SUSE",
  "Slackware",
  "Deepin",
  "FreeBSD",
  "OpenBSD",
  "NetBSD",
  "GhostBSD",
  "PC-BSD",
  "Solaris",
  "AIX",
  "HP-UX",
  "OS/2",
  "BeOS",
  "Haiku",
  "Amiga OS",
  "Morph OS",
  "SerenityOS",
]);

export const mobileOS = new Set([
  "iOS",
  "Android",
  "Windows Phone",
  "Windows Mobile",
  "BlackBerry",
  "Symbian",
  "Firefox OS",
  "Ubuntu Touch",
  "Sailfish",
  "Tizen",
  "KaiOS",
  "HarmonyOS",
  "OpenHarmony",
  "watchOS",
  "Android-x86",
  "RIM Tablet OS",
  "Bada",
  "WebOS",
  "Maemo",
  "MeeGo",
]);

export const tvOS = new Set([
  "Chromecast",
  "Chromecast Android",
  "Chromecast Fuchsia",
  "Chromecast Linux",
  "Chromecast SmartSpeaker",
  "NetTV",
  "NetRange",
]);

export const gamingOS = new Set(["PlayStation", "Xbox", "Nintendo"]);

export const otherOS = new Set([
  "Fuchsia",
  "GNU",
  "Hurd",
  "Plan9",
  "Contiki",
  "Pico",
  "Minix",
  "Unix",
  "OpenVMS",
  "RISC OS",
  "QNX",
  "Series40",
  "PCLinuxOS",
  "Linpus",
  "Linspire",
  "Mageia",
  "Mandriva",
  "Raspbian",
  "Sabayon",
  "VectorLinux",
  "Zenwalk",
  "DragonFly",
]);

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

// Helper function to get IP address
export const getIpAddress = (request: FastifyRequest): string => {
  // Check for proxied IP addresses
  const forwardedFor = request.headers["x-forwarded-for"];
  if (forwardedFor && typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0].trim();
  }

  // Check for Cloudflare
  const cfConnectingIp = request.headers["cf-connecting-ip"];
  if (cfConnectingIp && typeof cfConnectingIp === "string") {
    return cfConnectingIp;
  }

  // Fallback to direct IP
  return request.ip;
};

// Check if a site is public
export const isSitePublic = async (siteId: string | number) => {
  try {
    // Ensure the publicSites cache is initialized
    await publicSites.ensureInitialized();

    // Use the cached value
    return publicSites.isSitePublic(siteId);
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
