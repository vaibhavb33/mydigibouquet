import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS, type BlogCategory } from "@/lib/blog-posts";
import { buildPageMetadata } from "@/lib/seo";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BotanicalImage } from "@/components/ui/SkeletonCard";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const hasCategoryFilter = Boolean(sp.category);
  const baseMeta = buildPageMetadata({
    title: "Floral Gifting Journal — Flower Meanings, Bouquet Ideas & Note Inspiration",
    description:
      "Explore guides on digital gifting, Victorian flower meanings, birthday bouquet messages, anniversary gifts, arrangement silhouettes, and virtual greeting inspiration.",
    path: "/blog",
    keywords: [
      "digital gifting",
      "flower meanings",
      "bouquet ideas",
      "birthday messages",
      "anniversary gifts",
      "virtual flowers",
      "digital greeting inspiration",
    ],
  });
  return {
    ...baseMeta,
    robots: hasCategoryFilter ? { index: false, follow: true } : baseMeta.robots,
  };
}

const CATEGORIES: readonly BlogCategory[] = [
  "Digital Gifting",
  "Flower Meanings",
  "Bouquet Ideas",
  "Birthday Messages",
  "Anniversary Gifts",
  "Virtual Flowers",
  "Digital Greeting Inspiration",
];

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const activeCategory = CATEGORIES.find((c) => c === sp.category) ?? null;
  const visiblePosts = activeCategory
    ? BLOG_POSTS.filter((p) => p.category === activeCategory)
    : BLOG_POSTS;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
          ]}
        />

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-8">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
              Atelier Editorial Journal
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Guides on Flower Meanings, Bouquet Craft &amp; Gifting Notes
            </h1>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Curated articles covering digital gifting etiquette, symbolic botanical pairings,
              birthday and anniversary card writing, and modern floral composition principles.
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent-primary)] px-6 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:text-sm"
          >
            Create Your Bouquet &rarr;
          </Link>
        </div>

        {/* Category Filter Pills (clean canonical ?category navigation) */}
        <nav aria-label="Article categories" className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`inline-flex min-h-[38px] items-center rounded-full border px-4 text-xs font-semibold transition ${
              !activeCategory
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
            }`}
          >
            All Articles
          </Link>
          {CATEGORIES.map((category) => {
            const active = activeCategory === category;
            return (
              <Link
                key={category}
                href={`/blog?category=${encodeURIComponent(category)}`}
                className={`inline-flex min-h-[38px] items-center rounded-full border px-4 text-xs font-semibold transition ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                }`}
              >
                {category}
              </Link>
            );
          })}
        </nav>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Journal articles">
          {visiblePosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-primary)] hover:shadow-md"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[var(--bg-well)]/50 p-3"
              >
                <BotanicalImage
                  src={post.coverImage}
                  alt={post.coverAlt}
                  width={480}
                  height={300}
                  className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                />
              </Link>

              <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                    <span>{post.category}</span>
                    <span className="text-[var(--text-muted)]">{post.readingTimeMin} min read</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-medium leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                    {post.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-3 text-xs">
                  <time dateTime={post.publishedAt} className="text-[var(--text-muted)]">
                    {post.publishedAt}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    Read Guide &rarr;
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
