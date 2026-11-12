import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { and, eq, isNull } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { bouquets } from "@/db/schema";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { renderBouquetToContext2D } from "@/engine/canvas-renderer";
import { STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import type { BouquetSceneV1 } from "@/engine/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    let scene: BouquetSceneV1;
    let headline = "Hand-crafted Studio Bouquet";

    if (slug.startsWith("preset-")) {
      const presetId = slug.slice("preset-".length);
      const preset = STARTER_BOUQUETS.find((p) => p.id === presetId) ?? STARTER_BOUQUETS[0]!;
      scene = buildSceneFromPreset(preset, CATALOG_META_MAP);
      headline = preset.title;
    } else {
      await ensureDbReady();
      const rows = await db
        .select()
        .from(bouquets)
        .where(and(eq(bouquets.slug, slug), isNull(bouquets.deletedAt)))
        .limit(1);
      if (!rows[0]) {
        return new Response("Bouquet preview not found", {
          status: 404,
          headers: {
            "Cache-Control": "no-store, max-age=0",
            "X-Robots-Tag": "noindex, nofollow",
          },
        });
      }
      scene = JSON.parse(rows[0].sceneJson) as BouquetSceneV1;
      headline = scene.hideNamesInPreview ? "A Handcrafted Digital Bouquet" : rows[0].title;
    }

    const W = 1200;
    const H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    const publicRoot = path.join(process.cwd(), "public");
    const assetCache = new Map<string, CanvasImageSource | null>();

    await renderBouquetToContext2D(
      ctx as unknown as CanvasRenderingContext2D,
      W,
      H,
      scene,
      CATALOG_META_MAP,
      {
        async loadImage(relSrc: string): Promise<CanvasImageSource | null> {
          if (assetCache.has(relSrc)) return assetCache.get(relSrc) ?? null;
          const clean = relSrc.replace(/^\//, "");
          const abs = path.join(publicRoot, clean);
          if (!fs.existsSync(abs)) {
            assetCache.set(relSrc, null);
            return null;
          }
          const pngBuf = await sharp(abs).png().toBuffer();
          const img = (await loadImage(pngBuf)) as unknown as CanvasImageSource;
          assetCache.set(relSrc, img);
          return img;
        },
      },
      {
        aspect: "square",
        mimeType: "image/png",
        includeCardNote: false,
        includeColophon: false,
        useExportLod: false,
      },
    );

    // Subtle editorial left caption pill on OG image without obstructing centered bouquet
    const isDark = scene.presentation.tableSurfaceId === "slate";
    ctx.save();
    ctx.fillStyle = isDark ? "rgba(242, 236, 225, 0.94)" : "rgba(36, 35, 31, 0.9)";
    ctx.font = '600 28px Georgia, "Times New Roman", serif';
    ctx.fillText(headline.slice(0, 34), 48, 560);
    ctx.fillStyle = isDark ? "rgba(187, 180, 168, 0.85)" : "rgba(111, 106, 98, 0.88)";
    ctx.font = "500 18px system-ui, sans-serif";
    ctx.fillText("PETAL & PROSE • DIGITAL FLORAL ATELIER", 48, 592);
    ctx.restore();

    const isPublicAsset =
      !scene.hideNamesInPreview &&
      (slug.startsWith("preset-") ||
        slug.startsWith("sample-") ||
        slug.startsWith("pub-") ||
        Boolean(scene.isPublicShowcase));

    const pngOut = canvas.toBuffer("image/png");
    return new Response(new Uint8Array(pngOut), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": isPublicAsset ? "public, max-age=300" : "private, no-store",
        ...(isPublicAsset ? {} : { "X-Robots-Tag": "noindex, nofollow" }),
      },
    });
  } catch (err) {
    console.error("GET /api/og/[slug] error", err);
    return new Response("Unable to render OG image", { status: 500 });
  }
}
