"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { EXPORT_DIMENSIONS, type ExportAspectPreset, exportBouquetBlob } from "@/engine/canvas-renderer";
import { MIN_STEMS_MINIMALIST, MIN_STEMS_STANDARD, UI_COPY } from "@/engine/types";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { trackPrivacySafeEvent } from "@/lib/analytics";
import { useStudioScene } from "./StudioSceneProvider";

/**
 * Shared publish-link, social share, QR code, PNG/JPG export, and safe reset controls
 * used by both Mode A (Quick Create Step 5) and Mode B (Advanced Studio Export & Share tab).
 */
export function ShareAndExportControls({
  onEditStems,
  onEditCard,
  onAfterReset,
}: {
  onEditStems?: () => void;
  onEditCard?: () => void;
  onAfterReset?: () => void;
}) {
  const {
    scene,
    startNewBouquet,
    updateCard,
    setShowColophon,
    setHideNamesInPreview,
    setIsPublicShowcase,
    shareState,
    isPublishing,
    publishError,
    clearPublishError,
    publishShareLink,
  } = useStudioScene();

  const [exportAspect, setExportAspect] = useState<ExportAspectPreset>("square");
  const [includeNoteInExport, setIncludeNoteInExport] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"png" | "jpg" | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareActionFeedback, setShareActionFeedback] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const minStemsRequired =
    scene.presentation.compositionPreset === "minimalist"
      ? MIN_STEMS_MINIMALIST
      : MIN_STEMS_STANDARD;
  const hasEnoughStems = scene.stems.length >= minStemsRequired;
  const hasBlankMessageWarning = !scene.card.isVisualOnly && scene.card.message.trim().length === 0;

  useEffect(() => {
    if (!shareState || typeof window === "undefined") {
      setQrDataUrl(null);
      return;
    }
    const fullUrl = `${window.location.origin}${shareState.shareUrl}`;
    QRCode.toDataURL(fullUrl, { width: 220, margin: 1, color: { dark: "#1F241F", light: "#FDFBF7" } })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [shareState]);

  const handleDownloadExport = async (mime: "image/png" | "image/jpeg") => {
    const fmt = mime === "image/png" ? "png" : "jpg";
    setExportingFormat(fmt);
    setExportFeedback(null);
    setExportError(null);
    try {
      const effectiveAspect: ExportAspectPreset =
        mime === "image/jpeg" && exportAspect === "transparent" ? "square" : exportAspect;
      const res = await exportBouquetBlob(scene, CATALOG_META_MAP, {
        aspect: effectiveAspect,
        mimeType: mime,
        includeCardNote: includeNoteInExport,
        includeColophon: scene.showColophon,
      });

      const url = URL.createObjectURL(res.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      trackPrivacySafeEvent(fmt === "png" ? "export_png" : "export_jpg");
      setExportFeedback(`Downloaded ${res.filename} (${res.width}×${res.height})`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingFormat(null);
    }
  };

  const getFullShareUrl = () => {
    if (!shareState || typeof window === "undefined") return "";
    return `${window.location.origin}${shareState.shareUrl}`;
  };

  const handleCopyShareLink = async () => {
    const fullUrl = getFullShareUrl();
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setShareActionFeedback("Share link copied to clipboard.");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setShareActionFeedback("Could not copy automatically—use the URL field above.");
    }
  };

  const handleNativeShare = async () => {
    const fullUrl = getFullShareUrl();
    if (!fullUrl) return;
    const shareTitle = scene.card.recipientName
      ? `A digital bouquet for ${scene.card.recipientName}`
      : "A custom digital bouquet from Petal & Prose";
    const shareText = "I arranged a digital bouquet with a personal note for you:";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: fullUrl });
        setShareActionFeedback("Opened native device share sheet.");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await handleCopyShareLink();
    setShareActionFeedback("Link copied (native share unavailable in this desktop browser).");
  };

  return (
    <div className="space-y-4">
      {!hasEnoughStems && (
        <div
          data-testid="share-validation-banner"
          className="rounded-xl border border-[var(--status-error-border)] bg-[var(--status-error-fill)] p-3 text-xs text-[var(--status-error-ink)]"
        >
          <p className="font-semibold">More stems needed before sharing</p>
          <p className="mt-0.5">
            Please add at least {minStemsRequired} stems for this bouquet style before creating a
            shareable keepsake link.
          </p>
          {onEditStems && (
            <button type="button" onClick={onEditStems} className="mt-2 font-semibold underline">
              Add More Flowers →
            </button>
          )}
        </div>
      )}

      {hasBlankMessageWarning && (
        <div className="rounded-xl border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] p-3 text-xs text-[var(--status-warning-ink)]">
          <p>
            Your greeting card message is blank. Recipients will see an empty note unless you add one or toggle
            Bouquet Only.
          </p>
          {onEditCard && (
            <button type="button" onClick={onEditCard} className="mt-1 font-semibold underline">
              Edit Card Message →
            </button>
          )}
        </div>
      )}

      {/* Publish & Multi-Channel Share */}
      <div className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-white p-3.5">
        <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
          Share Keepsake Unboxing Link
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Generate a private link so your recipient can unbox this bouquet with your custom card.
        </p>

        <label className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 px-2.5 py-2 text-xs text-[var(--text-primary)]">
          <input
            type="checkbox"
            data-testid="toggle-animated-reveal"
            checked={scene.card.enableAnimatedReveal !== false}
            onChange={(e) => updateCard({ enableAnimatedReveal: e.target.checked })}
            className="rounded accent-[var(--accent-primary)]"
          />
          <span>Include animated wax-seal envelope reveal</span>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 px-2.5 py-2 text-xs text-[var(--text-primary)]">
          <input
            type="checkbox"
            data-testid="toggle-hide-names-share"
            checked={Boolean(scene.hideNamesInPreview)}
            onChange={(e) => setHideNamesInPreview(e.target.checked)}
            className="rounded accent-[var(--accent-primary)]"
          />
          <span>Hide recipient &amp; sender names in link previews &amp; search tags</span>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 px-2.5 py-2 text-xs text-[var(--text-primary)]">
          <input
            type="checkbox"
            data-testid="toggle-public-showcase"
            disabled={Boolean(scene.hideNamesInPreview)}
            checked={Boolean(scene.isPublicShowcase) && !scene.hideNamesInPreview}
            onChange={(e) => setIsPublicShowcase(e.target.checked)}
            className="rounded accent-[var(--accent-primary)] disabled:opacity-50"
          />
          <span className={scene.hideNamesInPreview ? "opacity-60" : ""}>
            Opt in to feature in public Gallery showcase (otherwise private link, noindex)
          </span>
        </label>

        {shareState?.isStale && (
          <div className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] px-3 py-2 text-xs text-[var(--status-warning-ink)]">
            {UI_COPY.shareStaleMessage}
          </div>
        )}

        {publishError && (
          <div
            data-testid="publish-error-banner"
            className="rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-fill)] px-3 py-2 text-xs text-[var(--status-error-ink)]"
          >
            <p>{publishError}</p>
            <button
              type="button"
              onClick={() => {
                clearPublishError();
                void publishShareLink();
              }}
              className="mt-1 font-semibold underline"
            >
              Retry Publish
            </button>
          </div>
        )}

        <button
          type="button"
          data-testid="publish-share-btn"
          disabled={isPublishing || !hasEnoughStems}
          onClick={publishShareLink}
          className="min-h-[44px] w-full rounded-xl bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isPublishing
            ? "Sealing Envelope…"
            : shareState
              ? shareState.isStale
                ? "Generate Updated Share Link"
                : "Create Another Snapshot Link"
              : "Create Shareable Bouquet Link"}
        </button>

        {shareState && (
          <div className="space-y-2.5 pt-1" data-testid="share-result-box">
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-well)]/50 p-2">
              <span className="flex-1 truncate font-mono text-xs">{shareState.shareUrl}</span>
              <button
                type="button"
                data-testid="copy-share-link-btn"
                onClick={handleCopyShareLink}
                className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold shadow-2xs hover:bg-[var(--bg-well)]"
              >
                {copiedLink ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                data-testid="share-whatsapp-btn"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${scene.card.recipientName ? `Hi ${scene.card.recipientName}, ` : ""}I arranged a digital bouquet for you on Petal & Prose: ${getFullShareUrl()}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[38px] items-center justify-center rounded-lg border border-[var(--border-hairline)] bg-white px-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                WhatsApp
              </a>
              <button
                type="button"
                data-testid="share-native-btn"
                onClick={handleNativeShare}
                className="min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-white px-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                Mobile Share
              </button>
            </div>

            {shareActionFeedback && (
              <p className="text-[11px] font-medium text-[var(--accent-primary)]">{shareActionFeedback}</p>
            )}

            <a
              href={shareState.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[40px] w-full items-center justify-center rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
            >
              Open Live Unboxing Page →
            </a>

            {qrDataUrl && (
              <div className="flex flex-col items-center rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Bouquet QR Code" className="h-32 w-32" />
                <a
                  href={qrDataUrl}
                  download={`petal-prose-qr-${shareState.slug}.png`}
                  className="mt-2 text-xs font-medium text-[var(--accent-primary)] underline"
                >
                  Download Printable QR Code
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* High-Res Studio Image Export (PNG & JPG) */}
      <div className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-white p-3.5">
        <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
          Download Keepsake Image
        </h3>

        <div className="space-y-1.5">
          {(Object.keys(EXPORT_DIMENSIONS) as ExportAspectPreset[]).map((aspect) => {
            const meta = EXPORT_DIMENSIONS[aspect];
            const active = exportAspect === aspect;
            return (
              <button
                key={aspect}
                type="button"
                onClick={() => setExportAspect(aspect)}
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] font-semibold text-[var(--accent-primary)]"
                    : "border-[var(--border-hairline)] bg-[var(--bg-well)]/30 text-[var(--text-secondary)]"
                }`}
              >
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5 pt-1 text-xs text-[var(--text-secondary)]">
          {exportAspect !== "transparent" && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeNoteInExport}
                  onChange={(e) => setIncludeNoteInExport(e.target.checked)}
                  className="rounded accent-[var(--accent-primary)]"
                />
                Print personal card message beneath bouquet
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scene.showColophon}
                  onChange={(e) => setShowColophon(e.target.checked)}
                  className="rounded accent-[var(--accent-primary)]"
                />
                Include Petal &amp; Prose studio signature
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scene.hideNamesInPreview}
                  onChange={(e) => setHideNamesInPreview(e.target.checked)}
                  className="rounded accent-[var(--accent-primary)]"
                />
                Hide sender name in image export
              </label>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="export-download-btn"
            disabled={exportingFormat !== null}
            onClick={() => handleDownloadExport("image/png")}
            className="min-h-[42px] rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
          >
            {exportingFormat === "png" ? "Rendering PNG…" : "Download PNG"}
          </button>
          <button
            type="button"
            data-testid="export-download-jpg-btn"
            disabled={exportingFormat !== null}
            onClick={() => handleDownloadExport("image/jpeg")}
            className="min-h-[42px] rounded-xl border border-[var(--accent-primary)] bg-white px-3 text-xs font-semibold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary-soft)] disabled:opacity-60"
          >
            {exportingFormat === "jpg" ? "Rendering JPG…" : "Download JPG"}
          </button>
        </div>

        {exportFeedback && (
          <p
            data-testid="export-feedback"
            className="rounded-lg bg-[var(--status-success-fill)] px-2.5 py-2 text-xs text-[var(--status-success-ink)]"
          >
            {exportFeedback}
          </p>
        )}
        {exportError && (
          <p className="rounded-lg bg-[var(--status-error-fill)] px-2.5 py-2 text-xs text-[var(--status-error-ink)]">
            {exportError}
          </p>
        )}
      </div>

      {/* Start Another Bouquet (guarded against accidental data loss) */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-well)]/40 p-3.5">
        {!confirmResetOpen ? (
          <button
            type="button"
            data-testid="start-another-btn"
            onClick={() => setConfirmResetOpen(true)}
            className="min-h-[40px] w-full rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            Start Another Bouquet
          </button>
        ) : (
          <div className="space-y-2" data-testid="confirm-new-bouquet-box">
            <p className="text-xs text-[var(--text-secondary)]">
              Start a fresh bouquet? Your current work can still be recovered with Undo.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="confirm-new-bouquet-btn"
                onClick={() => {
                  startNewBouquet();
                  setConfirmResetOpen(false);
                  onAfterReset?.();
                }}
                className="min-h-[36px] flex-1 rounded-lg bg-[var(--accent-primary)] px-2 text-xs font-semibold text-white"
              >
                Yes, Start Fresh
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium"
              >
                Keep Editing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

