import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { analyticsDaily } from "@/db/schema";
import { ALLOWED_ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/analytics";
import { isAnalyticsEnabled } from "@/lib/env";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbReady();
    const rows = await db
      .select({
        metricDate: analyticsDaily.metricDate,
        eventName: analyticsDaily.eventName,
        count: analyticsDaily.count,
      })
      .from(analyticsDaily)
      .orderBy(desc(analyticsDaily.metricDate))
      .limit(90);

    return NextResponse.json({
      privacyMode: "cookieless-dnt-gpc-honored",
      enabled: isAnalyticsEnabled(),
      aggregates: rows,
    });
  } catch (error) {
    console.error("GET /api/analytics error", error);
    return NextResponse.json({ error: "Unable to read analytics summary" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "analytics", limit: 120, windowMs: 60_000 });
  if (rateErr) return rateErr;

  if (!isAnalyticsEnabled()) {
    return NextResponse.json({ recorded: false, reason: "disabled" }, { status: 202 });
  }

  // Respect standard browser privacy headers on server side too
  const dnt = req.headers.get("dnt")?.trim();
  const secGpc = req.headers.get("sec-gpc")?.trim();
  if (dnt === "1" || secGpc === "1") {
    return NextResponse.json({ recorded: false, reason: "privacy-signal-honored" }, { status: 202 });
  }

  try {
    const body = (await req.json()) as { event?: unknown };
    const event = typeof body.event === "string" ? body.event.trim() : "";
    if (!ALLOWED_ANALYTICS_EVENTS.includes(event as AnalyticsEventName)) {
      return NextResponse.json({ error: "Unsupported analytics event" }, { status: 400 });
    }

    await ensureDbReady();
    const metricDate = new Date().toISOString().slice(0, 10);
    const id = `${metricDate}:${event}`;
    const now = new Date().toISOString();

    await db
      .insert(analyticsDaily)
      .values({
        id,
        metricDate,
        eventName: event,
        count: 1,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: analyticsDaily.id,
        set: {
          count: sql`${analyticsDaily.count} + 1`,
          updatedAt: now,
        },
      });

    return NextResponse.json({ recorded: true, event, metricDate }, { status: 202 });
  } catch (error) {
    console.error("POST /api/analytics error", error);
    return NextResponse.json({ error: "Unable to record event" }, { status: 500 });
  }
}

