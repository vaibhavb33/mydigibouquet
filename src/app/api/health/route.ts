import { NextResponse } from "next/server";
import { ensureDbReady } from "@/db";
import { CATALOG_ENTRIES } from "@/generated/catalog-manifest";
import { getDatabaseConfig, isAnalyticsEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbReady();
    const dbConfig = getDatabaseConfig();
    return NextResponse.json({
      ok: true,
      status: "healthy",
      catalogCount: CATALOG_ENTRIES.length,
      storageMode: dbConfig.mode,
      analyticsEnabled: isAnalyticsEnabled(),
    });
  } catch (err) {
    console.error("GET /api/health error", err);
    return NextResponse.json(
      { ok: false, status: "unhealthy", error: "Database unavailable" },
      { status: 500 },
    );
  }
}

