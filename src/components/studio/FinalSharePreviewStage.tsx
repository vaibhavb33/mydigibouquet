"use client";

import React, { useMemo, useState } from "react";
import { WAX_SEAL_COLOR_IDS } from "@/engine/types";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { getCardFontFamilies } from "@/lib/card-layout";
import { resolveCardAppearance } from "@/lib/card-styles";
import { BouquetCanvasDisplay } from "@/components/unboxing/BouquetCanvasDisplay";
import { useStudioScene } from "./StudioSceneProvider";

const WAX_HEX: Record<(typeof WAX_SEAL_COLOR_IDS)[number], string> = {
  "terracotta-rose": "#A8564B",
  "antique-gold": "#B59145",
  "forest-pine": "#35513D",
  "ivory-pearl": "#EAE3D6",
  "midnight-ink": "#23252C",
  champagne: "#CBB084",
};

export function FinalSharePreviewStage({
  onBackToStep,
}: {
  onBackToStep: (step: 3 | 4) => void;
}) {
  const { scene } = useStudioScene();
  const [testingReveal, setTestingReveal] = useState(false);
  const [revealedInPreview, setRevealedInPreview] = useState(true);

  const cardAppearance = useMemo(() => resolveCardAppearance(scene.card), [scene.card]);
  const fonts = useMemo(
    () => getCardFontFamilies(scene.card.fontPairingId),
    [scene.card.fontPairingId],
  );

  const handleToggleTestReveal = () => {
    if (testingReveal) {
      setTestingReveal(false);
      setRevealedInPreview(true);
    } else {
      setTestingReveal(true);
      setRevealedInPreview(false);
    }
  };

  return (
    <div
      data-testid="step5-final-preview"
      className="flex h-full w-full flex-col justify-between overflow-y-auto bg-[var(--bg-canvas)] p-4 md:p-6"
    >
      {/* Top Preview Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
            Step 5 · Final Bouquet & Card Preview
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Recipient preview ({scene.card.enableAnimatedReveal !== false ? "Wax-seal reveal enabled" : "Immediate presentation"})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="preview-reveal-btn"
            onClick={handleToggleTestReveal}
            className="min-h-[34px] rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            {testingReveal ? "Exit Reveal Simulation" : "Preview Envelope Reveal"}
          </button>
          <button
            type="button"
            onClick={() => onBackToStep(4)}
            className="min-h-[34px] rounded-full border border-[var(--border-hairline)] bg-[var(--bg-well)]/70 px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ← Edit Card
          </button>
        </div>
      </div>

      {/* Center Display */}
      {testingReveal && !revealedInPreview ? (
        <div className="my-auto flex flex-col items-center justify-center py-6 text-center">
          <button
            type="button"
            data-testid="preview-wax-seal-btn"
            onClick={() => setRevealedInPreview(true)}
            className="group flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-8 py-12 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <span
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/40 font-display text-2xl font-semibold text-white shadow-md transition group-hover:scale-105"
              style={{ backgroundColor: WAX_HEX[scene.card.waxSealColorId] }}
            >
              P&amp;P
            </span>
            <span className="mt-5 text-sm font-semibold text-[var(--accent-primary)]">
              Tap Wax Seal to Preview Reveal →
            </span>
            {scene.card.recipientName && (
              <span className="mt-1 text-xs text-[var(--text-muted)]">
                For {scene.card.recipientName}
              </span>
            )}
          </button>
        </div>
      ) : (
        <div
          className={`my-auto grid items-center gap-6 lg:grid-cols-12 ${
            testingReveal ? "petal-reveal" : ""
          }`}
        >
          <div className="flex justify-center lg:col-span-7">
            <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-white shadow-md">
              <BouquetCanvasDisplay
                scene={scene}
                width={800}
                height={960}
                includeColophon={scene.showColophon}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-3 lg:col-span-5">
            {!scene.card.isVisualOnly ? (
              <div
                className="relative overflow-hidden rounded-2xl border p-6 shadow-sm"
                style={{
                  backgroundColor: cardAppearance.backgroundColor,
                  borderColor: cardAppearance.borderColor,
                  color: cardAppearance.textColor,
                  textAlign: scene.card.textAlign,
                }}
              >
                {scene.card.showPressedPetalWatermark && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full opacity-15 blur-xs"
                    style={{ backgroundColor: "#E8A9AE" }}
                  />
                )}
                <p
                  className="text-xs"
                  style={{ fontFamily: fonts.displayFont, color: cardAppearance.mutedColor }}
                >
                  {scene.card.recipientName ? `Dearest ${scene.card.recipientName},` : "For Someone Special,"}
                </p>
                <p
                  className="mt-4 whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ fontFamily: fonts.bodyFont }}
                >
                  {scene.card.message || "Your personal message will appear here."}
                </p>
                <div className="mt-5 flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ fontFamily: fonts.displayFont, color: cardAppearance.mutedColor }}
                  >
                    {scene.card.senderName && !scene.hideNamesInPreview
                      ? `With warmth, ${scene.card.senderName}`
                      : ""}
                  </span>
                  <span
                    className="h-4 w-4 rounded-full border border-white/40"
                    style={{ backgroundColor: WAX_HEX[scene.card.waxSealColorId] }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-white/70 p-5 text-center text-xs text-[var(--text-secondary)]">
                Bouquet-Only Keepsake (personal message omitted)
              </div>
            )}

            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center justify-between font-medium text-[var(--text-primary)]">
                <span>Botanical Summary</span>
                <span>{scene.stems.length} stems</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] text-[var(--text-muted)]">
                {Array.from(new Set(scene.stems.map((s) => CATALOG_META_MAP.get(s.skuId)?.name ?? s.skuId))).join(
                  " • ",
                )}
              </p>
              {((scene.photos?.length ?? 0) > 0 || scene.voiceMessage) && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[var(--border-hairline)] pt-2">
                  {(scene.photos?.length ?? 0) > 0 && (
                    <span
                      data-testid="share-preview-photos-chip"
                      className="rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]"
                    >
                      {scene.photos!.length} keepsake {scene.photos!.length === 1 ? "photo" : "photos"}
                    </span>
                  )}
                  {scene.voiceMessage && (
                    <span
                      data-testid="share-preview-voice-chip"
                      className="rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]"
                    >
                      Voice note ({Math.max(1, Math.round(scene.voiceMessage.durationSec))}s)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
