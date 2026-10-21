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

// Per-instance limiter. Use Redis or a database for production.
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

function normalizeOrigin(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    // An origin must not contain credentials or a non-root path.
    if (
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function getVisitorIP(request: Request): string | null {
  if (process.env.VERCEL !== "1") return null;

  const candidate =
    request.headers.get("x-vercel-forwarded-for")?.trim() ||
    request.headers.get("x-real-ip")?.trim();

  // Only accept one valid IP, not a client-supplied list.
  return candidate && isIP(candidate) ? candidate : null;
}

function getVercelLocation(request: Request): GeoLocation | null {
  if (process.env.VERCEL !== "1") return null;

  const city = decodeHeader(request.headers.get("x-vercel-ip-city"));

  const region = decodeHeader(
    request.headers.get("x-vercel-ip-country-region"),
  );

  const countryCode = decodeHeader(request.headers.get("x-vercel-ip-country"));

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
    ? (countryNames[countryCode.toUpperCase()] ?? countryCode)
    : null;

  if (!city && !region && !country) return null;

  return { city, region, country };
}

async function lookupLocation(ip: string): Promise<GeoLocation | null> {
  try {
    const response = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      },
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
    console.error("Notification configuration is incomplete:", {
      hasBotToken: Boolean(token),
      hasChatId: Boolean(chatId),
      hasAppOrigin: Boolean(configuredOrigin),
      environment: process.env.VERCEL_ENV ?? "local",
    });

    return NextResponse.json(
      { error: "Notification service is not configured." },
      { status: 503 },
    );
  }

  const allowedOrigin = normalizeOrigin(configuredOrigin);
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));

  if (!allowedOrigin) {
    console.error("APP_ORIGIN is invalid.");
    return NextResponse.json(
      { error: "Notification service is not configured." },
      { status: 503 },
    );
  }

  // Reject requests without the expected browser origin.
  if (!requestOrigin || requestOrigin !== allowedOrigin) {
    console.warn("Notification origin rejected:", {
      requestOrigin,
      allowedOrigin,
    });

    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  }

  const ip = getVisitorIP(request);
  const rateKey = ip ?? "ip-unavailable";

  if (!allowNotification(rateKey)) {
    return NextResponse.json(
      { error: "Notification already recorded recently." },
      {
        status: 429,
        headers: { "Retry-After": "600" },
      },
    );
  }

  const receivedAt = new Date();

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
    "🟢 Visit",
    "",
    "Event: Checkbox completed",
    `Received: ${localTime}`,
    `UTC: ${receivedAt.toISOString()}`,
    "",
    `Public IP: ${ip ?? "Unavailable"}`,
    ...(ip ? [`IP Lookup: https://ipinfo.io/${encodeURIComponent(ip)}`] : []),
    `Approximate IP location: ${locationText}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          link_preview_options: {
            is_disabled: true,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error("Telegram notification failed:", {
        status: response.status,
        description: data?.description,
      });

      return NextResponse.json(
        { error: "Notification could not be sent." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Telegram request failed:", error);

    return NextResponse.json(
      { error: "Notification service unavailable." },
      { status: 502 },
    );
  }
}
