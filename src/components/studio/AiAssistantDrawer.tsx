"use client";

import React, { useEffect, useState } from "react";
import type { AiBouquetProposal } from "@/engine/ai-florist";
import { CORE_ELEVEN_OCCASIONS } from "@/engine/occasions";
import { COMPOSITION_PRESET_IDS, CompositionPresetId, OccasionSlug } from "@/engine/types";
import { useStudioScene } from "./StudioSceneProvider";

const QUICK_PROMPTS = [
  "Romantic blush peonies and silk ribbon for our anniversary",
  "Bright yellow sunflowers and wildflowers for a cheerful birthday",
  "Minimalist ivory orchids and monstera in crystal cellophane",
  "Warm apologetic garden bouquet with sweet peas and chamomile",
] as const;

export function AiAssistantDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { scene, applyFullScene } = useStudioScene();
  const [prompt, setPrompt] = useState("Soft romantic blush anniversary with peonies and silk wrap");
  const [occasion, setOccasion] = useState<OccasionSlug | "">("");
  const [preferredStyle, setPreferredStyle] = useState<CompositionPresetId | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<AiBouquetProposal[]>([]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const fetchSuggestions = async (overridePrompt?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assistant/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: overridePrompt ?? prompt,
          occasion,
          preferredStyle,
          currentScene: scene,
        }),
      });
      const json = (await res.json()) as {
        proposals?: AiBouquetProposal[];
        error?: string;
      };
      if (!res.ok || !Array.isArray(json.proposals)) {
        setError(json.error ?? "Unable to generate bouquet concepts.");
        return;
      }
      setProposals(json.proposals);
    } catch {
      setError("Network error while consulting the atelier florist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && proposals.length === 0) {
      void fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleApplyFull = (proposal: AiBouquetProposal) => {
    applyFullScene(
      proposal.scene,
      `Applied "${proposal.title}" as ${proposal.scene.stems.length} editable stems on canvas.`,
    );
    onClose();
  };

  const handleApplyStemsOnly = (proposal: AiBouquetProposal) => {
    applyFullScene(
      {
        ...scene,
        occasionTag: proposal.occasionTag,
        stems: proposal.scene.stems,
      },
      `Swapped canvas blooms to "${proposal.title}" (${proposal.scene.stems.length} editable stems).`,
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Bouquet Assistant"
      data-testid="ai-assistant-drawer"
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              AI Atelier Florist
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Describe a mood, recipient, or palette — apply any suggestion as real editable stems.
            </p>
          </div>
          <button
            type="button"
            data-testid="close-ai-drawer"
            onClick={onClose}
            className="min-h-[34px] rounded-full border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            Close
          </button>
        </div>

        <div className="space-y-2.5 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/60 p-4">
          <textarea
            rows={2}
            value={prompt}
            maxLength={400}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe occasion, flower cravings, mood, or color story..."
            data-testid="ai-prompt-input"
            className="w-full resize-none rounded-xl border border-[var(--border-hairline)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value as OccasionSlug | "")}
              aria-label="Filter by occasion"
              className="rounded-xl border border-[var(--border-hairline)] bg-white px-2.5 py-2 text-xs text-[var(--text-primary)]"
            >
              <option value="">Auto-detect Occasion</option>
              {CORE_ELEVEN_OCCASIONS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={preferredStyle}
              onChange={(e) => setPreferredStyle(e.target.value as CompositionPresetId | "")}
              aria-label="Filter by silhouette"
              className="rounded-xl border border-[var(--border-hairline)] bg-white px-2.5 py-2 text-xs text-[var(--text-primary)]"
            >
              <option value="">Auto-detect Style</option>
              {COMPOSITION_PRESET_IDS.map((styleId) => (
                <option key={styleId} value={styleId}>
                  {styleId} silhouette
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1">
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setPrompt(q);
                  void fetchSuggestions(q);
                }}
                className="rounded-full border border-[var(--border-hairline)] bg-white px-2.5 py-1 text-[10px] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                Idea {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchSuggestions()}
            data-testid="ai-suggest-btn"
            className="min-h-[38px] w-full rounded-xl bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
          >
            {loading ? "Composing Botanical Options..." : "Generate Editable Bouquet Concepts"}
          </button>

          {error && (
            <p className="text-[11px] font-medium text-[#8C332B]" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {proposals.map((proposal, idx) => (
            <article
              key={proposal.id}
              data-testid={`ai-proposal-card-${idx}`}
              className="rounded-2xl border border-[var(--border-hairline)] bg-white p-4 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-medium text-[var(--text-primary)]">
                    {proposal.title}
                  </h3>
                  <p className="text-[11px] capitalize text-[var(--text-muted)]">
                    {proposal.subtitle} • {proposal.scene.stems.length} stems
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1" title={proposal.paletteLabel}>
                  {proposal.paletteSwatches.map((hex, sIdx) => (
                    <span
                      key={`${proposal.id}-sw-${sIdx}`}
                      className="h-3.5 w-3.5 rounded-full border border-black/15"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                {proposal.rationale}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1">
                {proposal.stemNames.map((name) => (
                  <span
                    key={`${proposal.id}-${name}`}
                    className="rounded-full bg-[var(--bg-well)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
                  >
                    {name}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyFull(proposal)}
                  data-testid={`ai-apply-${idx}`}
                  className="min-h-[34px] flex-1 rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
                >
                  Apply Full Concept (Editable)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyStemsOnly(proposal)}
                  data-testid={`ai-apply-stems-${idx}`}
                  className="min-h-[34px] rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                  Stems Only
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

