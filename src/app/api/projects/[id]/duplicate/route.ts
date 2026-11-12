import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { bouquetProjects } from "@/db/schema";
import { validateAndNormalizeScene } from "@/engine/validation";
import { ALLOWED_SKU_IDS } from "@/generated/catalog-manifest";
import { sanitizeTextInput } from "@/engine/validation";
import { extractWorkspaceTokenHash } from "@/lib/workspace-server";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

const SAFE_PROJECT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "projects-duplicate", limit: 30, windowMs: 60_000 });
  if (rateErr) return rateErr;

  try {
    const tokenHash = extractWorkspaceTokenHash(req);
    if (!tokenHash) {
      return NextResponse.json({ error: "Missing or invalid workspace token" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!SAFE_PROJECT_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
    }

    await ensureDbReady();
    const rows = await db
      .select()
      .from(bouquetProjects)
      .where(
        and(
          eq(bouquetProjects.id, id),
          eq(bouquetProjects.workspaceTokenHash, tokenHash),
          isNull(bouquetProjects.deletedAt),
        ),
      )
      .limit(1);

    const source = rows[0];
    if (!source) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const parsed = JSON.parse(source.sceneJson) as unknown;
    const normalized = validateAndNormalizeScene(parsed, ALLOWED_SKU_IDS);
    if (!normalized.ok) {
      return NextResponse.json({ error: "Source scene cannot be duplicated" }, { status: 500 });
    }

    const copyId = randomUUID();
    const now = new Date().toISOString();
    const copyTitle = sanitizeTextInput(`${source.title} (Copy)`, 80, 160);

    await db.insert(bouquetProjects).values({
      id: copyId,
      workspaceTokenHash: tokenHash,
      title: copyTitle,
      occasionTag: source.occasionTag,
      stemCount: source.stemCount,
      sceneJson: JSON.stringify(normalized.scene),
      publishedSlug: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return NextResponse.json(
      {
        project: {
          id: copyId,
          title: copyTitle,
          occasionTag: source.occasionTag,
          stemCount: source.stemCount,
          publishedSlug: null,
          createdAt: now,
          updatedAt: now,
          scene: normalized.scene,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/projects/[id]/duplicate error", error);
    return NextResponse.json({ error: "Unable to duplicate project" }, { status: 500 });
  }
}

