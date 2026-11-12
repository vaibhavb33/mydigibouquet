import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ContactFormClient } from "@/components/ui/ContactFormClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Studio Desk & Bouquet Moderation",
  description:
    "Send studio feedback, bug reports, floral species suggestions, or shared bouquet moderation requests to the Petal & Prose team.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Contact Us", path: "/contact" },
          ]}
          className="mb-5"
        />
        <div className="max-w-2xl space-y-2.5 border-b border-[var(--border-hairline)] pb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
            Studio Desk
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Get in Touch With Us
          </h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Have an idea for a new flower stage, spotted an issue on mobile, or need to request
            removal of a shared bouquet link? Send us a direct note below.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7" aria-label="Contact message form">
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8">
              <ContactFormClient initialTopic={sp.topic ?? "general"} />
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-5">
            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
              <h2 className="font-display text-2xl font-medium">Removing or Editing a Bouquet</h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                When you publish a bouquet link in Step 5, a private edit token is generated for
                your session so you can adjust stems or update card notes cleanly. Need a shared
                bouquet removed from the database? Choose{" "}
                <strong className="font-semibold text-[var(--text-primary)]">
                  Bouquet Moderation / Removal
                </strong>{" "}
                in the topic selector and include the <code className="text-xs">/b/slug</code> URL.
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
              <h2 className="font-display text-2xl font-medium">Quick Answers First</h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                Looking for supported image/audio formats, privacy headers, or download aspect
                ratios? Check our FAQ or Privacy Policy.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/faq"
                  className="inline-flex min-h-[38px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                  Read FAQ
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex min-h-[38px] items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

