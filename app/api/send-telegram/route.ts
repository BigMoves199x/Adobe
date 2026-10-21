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

// Basic per-instance protection for this test system.
// Use a shared Redis/database limiter before a public launch.
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

function getVisitorIP(request: Request): string | null {
  if (process.env.TRUST_VERCEL_PROXY !== "true") {
    return null;
  }

  // Trust this only behind Vercel's managed proxy.
  // Do not replace it with arbitrary client-provided headers.
  const forwarded = request.headers.get("x-vercel-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim();

  return candidate && isIP(candidate) ? candidate : null;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 120);

  return cleaned || null;
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

  // Reject browser requests from other sites.
  // This is an origin check, not authentication.
  if (request.headers.get("origin") !== allowedOrigin) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 }
    );
  }

  const ip = getVisitorIP(request);

  // Local tests share one rate-limit bucket.
  const rateKey = ip ?? "local-test";

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
  const location = ip ? await lookupLocation(ip) : null;

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
    `Public IP: ${ip ?? "Unavailable — local or unconfigured proxy"}`,
    `Approximate IP location: ${locationText}`,
    "",
    "IP location is an estimate, not a precise device location.",
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
      }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        { error: "Notification could not be sent." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Notification service unavailable." },
      { status: 502 }
    );
  }
}