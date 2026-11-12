"use client";

import React, { useState } from "react";
import type { FaqItem } from "@/lib/site-content";

export function FaqAccordion({
  items,
  allowCategoryFilter = false,
}: {
  items: readonly FaqItem[];
  allowCategoryFilter?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  const visibleItems =
    activeCategory === "All" ? items : items.filter((item) => item.category === activeCategory);

  return (
    <div className="space-y-6">
      {allowCategoryFilter && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="FAQ categories">
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat)}
                className={`min-h-[38px] rounded-full border px-4 text-xs font-semibold transition ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {visibleItems.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              data-testid={`faq-item-${item.id}`}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] transition hover:border-[var(--border-strong)]"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-display text-lg font-medium text-[var(--text-primary)] sm:text-xl">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] text-sm font-semibold text-[var(--accent-primary)]"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-[var(--border-hairline)] px-5 py-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

