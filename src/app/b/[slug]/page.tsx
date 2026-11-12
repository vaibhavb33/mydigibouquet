import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db, ensureDbReady } from "@/db";
import { bouquets } from "@/db/schema";
import { alexBrush } from "@/lib/fonts-script";
import { loraFont } from "@/lib/fonts-literary";
import type { BouquetSceneV1 } from "@/engine/types";
import { absoluteUrl } from "@/lib/seo";
import { BouquetUnboxingClient } from "@/components/unboxing/BouquetUnboxingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  await ensureDbReady();
  const rows = await db
    .select()
    .from(bouquets)
    .where(and(eq(bouquets.slug, slug), isNull(bouquets.deletedAt)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { title: "Bouquet Not Found", robots: { index: false, follow: false } };
  }

  let parsedScene: BouquetSceneV1 | null = null;
  try {
    parsedScene = JSON.parse(row.sceneJson) as BouquetSceneV1;
  } catch {
    parsedScene = null;
  }

  const hideNames = Boolean(parsedScene?.hideNamesInPreview);
  const isIndexableShowcase =
    Boolean(parsedScene?.isPublicShowcase || slug.startsWith("sample-") || slug.startsWith("pub-")) &&
    !hideNames;

  const safeTitle = hideNames ? "A Handcrafted Digital Bouquet" : row.title;
  const safeDesc = hideNames
    ? "Tap the wax seal to unwrap a hand-arranged digital bouquet crafted in Petal & Prose."
    : "Unwrap your hand-crafted digital flower arrangement and personal keepsake card.";
  const ogImage = absoluteUrl(`/api/og/${row.slug}`);

  return {
    title: safeTitle,
    description: safeDesc,
    alternates: isIndexableShowcase
      ? { canonical: absoluteUrl(`/b/${row.slug}`) }
      : undefined,
    robots: isIndexableShowcase
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      title: safeTitle,
      description: safeDesc,
      url: absoluteUrl(`/b/${row.slug}`),
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
  await ensureDbReady();
  const rows = await db
    .select()
    .from(bouquets)
    .where(and(eq(bouquets.slug, slug), isNull(bouquets.deletedAt)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    notFound();
  }

  const scene = JSON.parse(row.sceneJson) as BouquetSceneV1;

  return (
    <div className={`${alexBrush.variable} ${loraFont.variable}`}>
      <BouquetUnboxingClient slug={row.slug} title={row.title} scene={scene} />
    </div>
  );
}

