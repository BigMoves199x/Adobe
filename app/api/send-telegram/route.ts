
import { isIP } from "node:net";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GeoLocation = {
  city: string | null;
  region: string | null;
  country: string | null;
};

type RateEntry = {
  count: number;
  expiresAt: number;
};

// Per-instance limiter for testing only.
// Use Redis or a database for production rate limiting.
const rateEntries = new Map<string, RateEntry>();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_NOTIFICATIONS = 1;
const MAX_ENTRIES = 5000;

function allowNotification(key: string): boolean {
  const now = Date.now();

  for (const [entryKey, entry] of rateEntries) {
    if (entry.expiresAt <= now) {
      rateEntries.delete(entryKey);
    }
  }

  const existing = rateEntries.get(key);

  if (existing) {
    if (existing.count >= MAX_NOTIFICATIONS) return false;
    existing.count += 1;
    return true;
  }

  if (rateEntries.size >= MAX_ENTRIES) return false;

  rateEntries.set(key, {
    count: 1,
    expiresAt: now + WINDOW_MS,
  });

  return true;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 120);

  return cleaned || null;
}

function decodeHeader(value: string | null): string | null {
  if (!value) return null;

  try {
    return cleanText(decodeURIComponent(value));
  } catch {
    return cleanText(value);
  }
}

function getVisitorIP(request: Request): string | null {
  // Only trust these headers when the request reaches
  // your application through Vercel's managed proxy.
  if (process.env.VERCEL !== "1") return null;

  const candidate =
    request.headers.get("x-vercel-forwarded-for")?.trim() ||
    request.headers.get("x-real-ip")?.trim();

  // Reject comma-separated lists and invalid IP addresses.
  return candidate && isIP(candidate) ? candidate : null;
}

function getVercelLocation(
  request: Request
): GeoLocation | null {
  if (process.env.VERCEL !== "1") return null;

  const city = decodeHeader(
    request.headers.get("x-vercel-ip-city")
  );

  const region = decodeHeader(
    request.headers.get("x-vercel-ip-country-region")
  );

  const countryCode = decodeHeader(
    request.headers.get("x-vercel-ip-country")
  );

  const countryNames: Record<string, string> = {
    NG: "Nigeria",
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    GH: "Ghana",
    ZA: "South Africa",
    KE: "Kenya",
    IN: "India",
    DE: "Germany",
    FR: "France",
    AU: "Australia",
  };

  const country = countryCode
    ? countryNames[countryCode.toUpperCase()] ?? countryCode
    : null;

  if (!city && !region && !country) return null;

  return { city, region, country };
}

async function lookupLocation(
  ip: string
): Promise<GeoLocation | null> {
  try {
    const response = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || data.error) return null;

    return {
      city: cleanText(data.city),
      region: cleanText(data.region),
      country: cleanText(data.country_name),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const configuredOrigin = process.env.APP_ORIGIN;

  if (!token || !chatId || !configuredOrigin) {
    return NextResponse.json(
      { error: "Notification service is not configured." },
      { status: 503 }
    );
  }

  let allowedOrigin: string;

  try {
    allowedOrigin = new URL(configuredOrigin).origin;
  } catch {
    return NextResponse.json(
      { error: "Notification service is not configured." },
      { status: 503 }
    );
  }

  // Origin validation is not authentication.
  if (request.headers.get("origin") !== allowedOrigin) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 }
    );
  }

  const ip = getVisitorIP(request);

  // Local requests share one bucket.
  // If the IP is unavailable, use one fallback bucket.
  const rateKey = ip ?? "ip-unavailable";

  if (!allowNotification(rateKey)) {
    return NextResponse.json(
      { error: "Notification already recorded recently." },
      {
        status: 429,
        headers: { "Retry-After": "600" },
      }
    );
  }

  const receivedAt = new Date();

  // Prefer Vercel's geolocation headers.
  // Use the external service only when an IP exists
  // and Vercel did not provide location information.
  let location = getVercelLocation(request);

  if (ip && !location) {
    location = await lookupLocation(ip);
  }

  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "long",
  }).format(receivedAt);

  const locationText = location
    ? [location.city, location.region, location.country]
        .filter(Boolean)
        .join(", ") || "Unavailable"
    : "Unavailable";

  const message = [
    "🟢 Document Space",
    "",
    "Event: Demo checkbox completed",
    `Received: ${localTime}`,
    `UTC: ${receivedAt.toISOString()}`,
    "",
    `Public IP: ${ip ?? "Unavailable — check Vercel deployment and headers"}`,
    `Approximate IP location: ${locationText}`,
    "",
    "IP location is an estimate, not a precise device location.",
  ].join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          link_preview_options: {
            is_disabled: true,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("Telegram notification failed:", {
        status: response.status,
        description: data?.description,
      });

      return NextResponse.json(
        { error: "Notification could not be sent." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Telegram request failed:", error);

    return NextResponse.json(
      { error: "Notification service unavailable." },
      { status: 502 }
    );
  }
}
