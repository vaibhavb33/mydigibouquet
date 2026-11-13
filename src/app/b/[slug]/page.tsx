import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { bouquets } from "@/db/schema";
import { alexBrush } from "@/lib/fonts-script";
import { loraFont } from "@/lib/fonts-literary";
import { STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import type { BouquetSceneV1 } from "@/engine/types";
import { absoluteUrl } from "@/lib/seo";
import { BouquetUnboxingClient } from "@/components/unboxing/BouquetUnboxingClient";

export const dynamic = "force-dynamic";

const loadBouquetBySlug = cache(async (slug: string) => {
  await ensureDbReady();
  const rows = await db
    .select()
    .from(bouquets)
    .where(and(eq(bouquets.slug, slug), isNull(bouquets.deletedAt)))
    .limit(1);

  const row = rows[0];
  if (row) {
    try {
      return {
        slug: row.slug,
        title: row.title,
        scene: JSON.parse(row.sceneJson) as BouquetSceneV1,
      };
    } catch {
      return null;
    }
  }

  if (slug.startsWith("preset-")) {
    const presetId = slug.slice("preset-".length);
    const preset = STARTER_BOUQUETS.find((p) => p.id === presetId);
    if (preset) {
      const baseScene = buildSceneFromPreset(preset, CATALOG_META_MAP);
      return {
        slug,
        title: preset.title,
        scene: { ...baseScene, isPublicShowcase: true, hideNamesInPreview: false },
      };
    }
  }

  return null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadBouquetBySlug(slug);
  if (!loaded) {
    return { title: "Bouquet Not Found", robots: { index: false, follow: false } };
  }

  const hideNames = Boolean(loaded.scene.hideNamesInPreview);
  const isIndexableShowcase =
    Boolean(loaded.scene.isPublicShowcase || slug.startsWith("sample-") || slug.startsWith("pub-")) &&
    !hideNames;

  const safeTitle = hideNames ? "A Handcrafted Digital Bouquet" : loaded.title;
  const safeDesc = hideNames
    ? "Tap the wax seal to unwrap a hand-arranged digital bouquet crafted in Petal & Prose."
    : "Unwrap your hand-crafted digital flower arrangement and personal keepsake card.";
  const ogImage = absoluteUrl(`/api/og/${loaded.slug}`);

  return {
    title: safeTitle,
    description: safeDesc,
    alternates: isIndexableShowcase
      ? { canonical: absoluteUrl(`/b/${loaded.slug}`) }
      : undefined,
    robots: isIndexableShowcase
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: safeTitle,
      description: safeDesc,
      url: absoluteUrl(`/b/${loaded.slug}`),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: safeTitle,
      description: safeDesc,
      images: [ogImage],
    },
  };
}

export default async function SharedBouquetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loaded = await loadBouquetBySlug(slug);
  if (!loaded) {
    notFound();
  }

  return (
    <div className={`${alexBrush.variable} ${loraFont.variable}`}>
      <BouquetUnboxingClient slug={loaded.slug} title={loaded.title} scene={loaded.scene} />
    </div>
  );
}

