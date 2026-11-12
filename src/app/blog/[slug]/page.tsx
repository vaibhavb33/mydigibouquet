import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog-posts";
import {
  buildArticleSchema,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/seo";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BotanicalImage } from "@/components/ui/SkeletonCard";

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return buildPageMetadata({
      title: "Article Not Found",
      description: "Requested floral editorial guide was not found.",
      path: "/blog",
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: [post.targetKeyword, post.category.toLowerCase(), "digital bouquet"],
    ogImage: post.coverImage,
    type: "article",
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const articleSchema = buildArticleSchema(post);
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]}
        />

        <article className="mt-6">
          <header className="space-y-4 border-b border-[var(--border-hairline)] pb-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
              <span>{post.category}</span>
              <span aria-hidden="true" className="text-[var(--text-muted)]">
                &bull;
              </span>
              <time dateTime={post.publishedAt} className="text-[var(--text-muted)]">
                Published {post.publishedAt}
              </time>
              <span aria-hidden="true" className="text-[var(--text-muted)]">
                &bull;
              </span>
              <span className="text-[var(--text-muted)]">{post.readingTimeMin} min read</span>
            </div>

            <h1 className="font-display text-4xl leading-[1.1] font-medium tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {post.description}
            </p>
          </header>

          <div className="my-8 overflow-hidden rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <div className="mx-auto aspect-[16/9] max-w-md overflow-hidden rounded-2xl bg-[var(--bg-well)]/40 p-3">
              <BotanicalImage
                src={post.coverImage}
                alt={post.coverAlt}
                width={540}
                height={320}
                priority
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-9">
            {post.sections.map((section) => (
              <section key={section.heading} className="space-y-3">
                <h2 className="font-display text-2xl font-medium text-[var(--text-primary)] sm:text-3xl">
                  {section.heading}
                </h2>
                {section.paragraphs.map((p, idx) => (
                  <p
                    key={idx}
                    className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base"
                  >
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {section.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-primary)]"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Contextual Studio Conversion Box */}
          <div className="mt-12 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">
                Try It Inside the Atelier
              </p>
              <h2 className="font-display text-2xl font-medium">
                Craft Your Own Bouquet Free Online
              </h2>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                Arrange open blooms, filler stems, wraps, ribbons, cropped photos, and voice notes
                with zero signup required.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-0 sm:shrink-0">
              <Link
                href={
                  post.relatedOccasion
                    ? `/studio?occasion=${post.relatedOccasion}`
                    : "/studio"
                }
                className="inline-flex min-h-[42px] items-center rounded-full bg-[var(--accent-primary)] px-5 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
              >
                Open Studio
              </Link>
              {post.relatedSpecies && (
                <Link
                  href={`/flowers/${post.relatedSpecies}`}
                  className="inline-flex min-h-[42px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                  Species Guide
                </Link>
              )}
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <section className="mt-14 border-t border-[var(--border-hairline)] pt-10">
          <h2 className="font-display text-2xl font-medium sm:text-3xl">More from the Journal</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {relatedPosts.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--accent-primary)]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  {rel.category}
                </span>
                <h3 className="mt-1 font-display text-lg font-medium leading-snug text-[var(--text-primary)]">
                  {rel.title}
                </h3>
                <span className="mt-2 inline-block text-xs font-semibold text-[var(--accent-primary)]">
                  Read &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

