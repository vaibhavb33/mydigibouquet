import React from "react";
import Link from "next/link";
import { buildBreadcrumbSchema, serializeJsonLd } from "@/lib/seo";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function Breadcrumbs({
  items,
  includeJsonLd = true,
  className = "",
}: {
  items: readonly BreadcrumbItem[];
  includeJsonLd?: boolean;
  className?: string;
}) {
  const schema = buildBreadcrumbSchema(items);

  return (
    <>
      {includeJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      )}
      <nav
        aria-label="Breadcrumb"
        className={`flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span aria-current="page" className="font-medium text-[var(--text-primary)]">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="transition hover:text-[var(--accent-primary)]">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

