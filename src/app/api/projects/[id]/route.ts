import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { bouquetProjects } from "@/db/schema";
import { validateAndNormalizeScene } from "@/engine/validation";
import { ALLOWED_SKU_IDS } from "@/generated/catalog-manifest";
import { deriveProjectTitle, extractWorkspaceTokenHash } from "@/lib/workspace-server";
import { assertSameOrigin, checkRateLimit } from "@/lib/request-security";

const SAFE_PROJECT_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
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

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const parsed = JSON.parse(row.sceneJson) as unknown;
    const normalized = validateAndNormalizeScene(parsed, ALLOWED_SKU_IDS);
    if (!normalized.ok) {
      return NextResponse.json({ error: "Saved scene data corrupted" }, { status: 500 });
    }

    return NextResponse.json({
      project: {
        id: row.id,
        title: row.title,
        occasionTag: row.occasionTag,
        stemCount: row.stemCount,
        publishedSlug: row.publishedSlug,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        scene: normalized.scene,
      },
    });
  } catch (error) {
    console.error("GET /api/projects/[id] error", error);
    return NextResponse.json({ error: "Unable to open saved project" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "projects-mutate", limit: 60, windowMs: 60_000 });
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
    const existingRows = await db
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

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rawBody = (await req.json()) as {
      title?: string;
      scene?: unknown;
      publishedSlug?: string | null;
    };

    const nextSceneRaw = rawBody.scene ?? (JSON.parse(existing.sceneJson) as unknown);
    const validated = validateAndNormalizeScene(nextSceneRaw, ALLOWED_SKU_IDS);
    if (!validated.ok) {
      return NextResponse.json(
        { error: validated.error, fieldErrors: validated.fieldErrors },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const nextTitle =
      rawBody.title !== undefined
        ? deriveProjectTitle(validated.scene, rawBody.title)
        : existing.title;
    const nextOccasion = validated.scene.occasionTag ?? null;
    const nextStemCount = validated.scene.stems.length;
    const nextPublishedSlug =
      rawBody.publishedSlug !== undefined
        ? typeof rawBody.publishedSlug === "string" && /^[a-z0-9_-]{3,40}$/i.test(rawBody.publishedSlug)
          ? rawBody.publishedSlug
          : null
        : existing.publishedSlug;

    await db
      .update(bouquetProjects)
      .set({
        title: nextTitle,
        occasionTag: nextOccasion,
        stemCount: nextStemCount,
        sceneJson: JSON.stringify(validated.scene),
        publishedSlug: nextPublishedSlug,
        updatedAt: now,
      })
      .where(and(eq(bouquetProjects.id, id), eq(bouquetProjects.workspaceTokenHash, tokenHash)));

    return NextResponse.json({
      project: {
        id,
        title: nextTitle,
        occasionTag: nextOccasion,
        stemCount: nextStemCount,
        publishedSlug: nextPublishedSlug,
        createdAt: existing.createdAt,
        updatedAt: now,
        scene: validated.scene,
      },
    });
  } catch (error) {
    console.error("PATCH /api/projects/[id] error", error);
    return NextResponse.json({ error: "Unable to update saved project" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const originErr = assertSameOrigin(req);
  if (originErr) return originErr;

  const rateErr = checkRateLimit(req, { bucket: "projects-mutate", limit: 60, windowMs: 60_000 });
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
    const existingRows = await db
      .select({ id: bouquetProjects.id })
      .from(bouquetProjects)
      .where(
        and(
          eq(bouquetProjects.id, id),
          eq(bouquetProjects.workspaceTokenHash, tokenHash),
          isNull(bouquetProjects.deletedAt),
        ),
      )
      .limit(1);

    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    await db
      .update(bouquetProjects)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(bouquetProjects.id, id), eq(bouquetProjects.workspaceTokenHash, tokenHash)));

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error", error);
    return NextResponse.json({ error: "Unable to delete saved project" }, { status: 500 });
  }
}

