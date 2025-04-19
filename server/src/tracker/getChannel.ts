import {
  affiliateMediums,
  audioMediums,
  displayMediums,
  emailMediums,
  emailAppIds,
  emailSources,
  isMobileAppId,
  pushMediums,
  referralMediums,
  searchAppIds,
  searchDomains,
  searchSources,
  shoppingAppIds,
  shoppingDomains,
  shoppingSources,
  smsSources,
  socialAppIds,
  socialDomains,
  socialMediums,
  socialSources,
  videoAppIds,
  videoDomains,
  videoMediums,
  videoSources,
} from "./const.js";
import { getUTMParams } from "./trackingUtils.js";

// Categorize mobile app by its bundle ID/package name
function getMobileAppCategory(
  appId: string
): { type: string; isPaid: boolean } | null {
  const appIdLower = appId.toLowerCase();

  // Check against our defined app ID lists
  if (socialAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Social", isPaid: false };
  }

  if (videoAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Video", isPaid: false };
  }

  if (searchAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Search", isPaid: false };
  }

  if (emailAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Email", isPaid: false };
  }

  if (shoppingAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Shopping", isPaid: false };
  }

  return null;
}

function getDomainFromReferrer(referrer: string): string {
  if (!referrer) return "$direct";

  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch (e) {
    // Handle invalid URLs
    return "$direct";
  }
}

// Checks if the referrer is from the same site as the current hostname
function isSelfReferral(referringDomain: string, hostname: string): boolean {
  if (!referringDomain || !hostname) return false;

  // Handle subdomain variations
  // Strip 'www.' prefixes for both domains
  const stripWww = (domain: string) => domain.replace(/^www\./, "");
  const refDomain = stripWww(referringDomain);
  const currentDomain = stripWww(hostname);

  // Check if domains match or if referrer is a subdomain of current domain
  return refDomain === currentDomain || refDomain.endsWith("." + currentDomain);
}

export function getChannel(
  referrer: string,
  querystring: string,
  hostname?: string
): string {
  const utmParams = getUTMParams(querystring);
  const referringDomain = getDomainFromReferrer(referrer);

  // Check if this is a self-referral (internal navigation)
  const selfReferral = hostname
    ? isSelfReferral(referringDomain, hostname)
    : false;

  // UTM parameters
  const utmSource = utmParams["utm_source"] || "";
  const utmMedium = utmParams["utm_medium"] || "";
  const utmCampaign = utmParams["utm_campaign"] || "";
  const gclid = utmParams["gclid"] || "";
  const gadSource = utmParams["gad_source"] || "";

  // Check for mobile app sources using reverse DNS format (bundle IDs/package names)
  if (utmSource && isMobileAppId(utmSource)) {
    const appCategory = getMobileAppCategory(utmSource);
    if (appCategory) {
      return appCategory.isPaid
        ? "Paid " + appCategory.type.split(" ")[1]
        : appCategory.type;
    }
  }

  // If it's a self-referral and has no UTM parameters, treat it as internal traffic
  if (
    !referrer &&
    !utmSource &&
    !utmMedium &&
    !utmCampaign &&
    !gclid &&
    !gadSource
  ) {
    return selfReferral ? "Internal" : "Direct";
  }

  // Check if traffic is paid
  const isPaid =
    ["cpc", "cpm", "cpv", "cpa", "ppc", "retargeting"].includes(utmMedium) ||
    utmMedium.startsWith("paid") ||
    gclid !== "" ||
    gadSource !== "";

  // Check domain type - improved to handle subdomains better
  const isDomainSearch = searchDomains.some(
    (domain) =>
      referringDomain === domain ||
      referringDomain.endsWith("." + domain) ||
      (domain.endsWith(".") && referringDomain.startsWith(domain))
  );
  const isDomainSocial = socialDomains.some(
    (domain) =>
      referringDomain === domain ||
      referringDomain.endsWith("." + domain) ||
      (domain.endsWith(".") && referringDomain.startsWith(domain))
  );
  const isDomainVideo = videoDomains.some(
    (domain) =>
      referringDomain === domain ||
      referringDomain.endsWith("." + domain) ||
      (domain.endsWith(".") && referringDomain.startsWith(domain))
  );
  const isDomainShopping = shoppingDomains.some(
    (domain) =>
      referringDomain === domain ||
      referringDomain.endsWith("." + domain) ||
      (domain.endsWith(".") && referringDomain.startsWith(domain))
  );

  // Check source type
  const isSourceSearch = searchSources.includes(utmSource);
  const isSourceSocial = socialSources.includes(utmSource);
  const isSourceVideo = videoSources.includes(utmSource);
  const isSourceShopping = shoppingSources.includes(utmSource);
  const isSourceEmail = emailSources.includes(utmSource);
  const isSourceSMS = smsSources.includes(utmSource);

  // Apply channel detection logic (in order of precedence)

  // Cross Network
  if (utmCampaign === "cross-network") return "Cross-Network";

  // Paid channels
  if (isPaid) {
    if (isSourceSearch || isDomainSearch) return "Paid Search";
    if (isSourceSocial || isDomainSocial) return "Paid Social";
    if (isSourceVideo || isDomainVideo) return "Paid Video";
    if (isSourceShopping || isDomainShopping) return "Paid Shopping";
    if (socialMediums.includes(utmMedium)) return "Paid Social";
    if (videoMediums.includes(utmMedium)) return "Paid Video";
    if (displayMediums.includes(utmMedium)) return "Display";
    if (gadSource === "1") return "Paid Search";
    if (/video/.test(utmCampaign)) return "Paid Video";
    return "Paid Unknown";
  }

  // Direct
  if (
    (referringDomain === "$direct" || (!referrer && !selfReferral)) &&
    !utmMedium &&
    (!utmSource || utmSource === "direct" || utmSource === "(direct)")
  ) {
    return "Direct";
  }

  // Organic channels - with referrer domain check prioritized for more accurate detection
  // This is the key part that handles organic search from Google clicks without UTM params
  if (isDomainSearch) return "Organic Search";
  if (isDomainSocial) return "Organic Social";
  if (isDomainVideo) return "Organic Video";
  if (isDomainShopping) return "Organic Shopping";

  // Then check UTM parameters if referrer didn't match
  if (isSourceSearch) return "Organic Search";
  if (isSourceSocial) return "Organic Social";
  if (isSourceVideo) return "Organic Video";
  if (isSourceShopping) return "Organic Shopping";
  if (isSourceEmail || emailMediums.includes(utmMedium)) return "Email";
  if (isSourceSMS) return "SMS";

  // Medium-based detection
  if (socialMediums.includes(utmMedium)) return "Organic Social";
  if (videoMediums.includes(utmMedium)) return "Organic Video";
  if (affiliateMediums.includes(utmMedium)) return "Affiliate";
  if (referralMediums.includes(utmMedium)) return "Referral";
  if (displayMediums.includes(utmMedium)) return "Display";
  if (audioMediums.includes(utmMedium)) return "Audio";
  if (pushMediums.includes(utmMedium) || utmMedium.endsWith("push"))
    return "Push";

  // Campaign-based detection
  if (/video/.test(utmCampaign)) return "Organic Video";
  if (/shop|shopping/.test(utmCampaign)) return "Organic Shopping";

  // If referring domain exists but we couldn't categorize it
  // Don't mark as referral if it's a self-referral
  if (referringDomain && referringDomain !== "$direct" && !selfReferral)
    return "Referral";

  // Default fallback
  return "Unknown";
}
