"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BouquetSceneV1 } from "@/engine/types";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { exportBouquetBlob } from "@/engine/canvas-renderer";
import { getCardFontFamilies } from "@/lib/card-layout";
import { resolveCardAppearance } from "@/lib/card-styles";
import { trackPrivacySafeEvent } from "@/lib/analytics";
import { BouquetCanvasDisplay } from "./BouquetCanvasDisplay";

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const WAX_HEX: Record<BouquetSceneV1["card"]["waxSealColorId"], string> = {
  "terracotta-rose": "#A8564B",
  "antique-gold": "#B59145",
  "forest-pine": "#35513D",
  "ivory-pearl": "#EAE3D6",
  "midnight-ink": "#23252C",
  champagne: "#CBB084",
};

export function BouquetUnboxingClient({
  slug,
  title,
  scene,
}: {
  slug: string;
  title: string;
  scene: BouquetSceneV1;
}) {
  const [opened, setOpened] = useState(() => scene.card.enableAnimatedReveal === false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceTimeSec, setVoiceTimeSec] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloadingFmt, setDownloadingFmt] = useState<"png" | "jpg" | null>(null);
  const [copied, setCopied] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowRight" && scene.photos?.length) {
        setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % scene.photos!.length));
      } else if (e.key === "ArrowLeft" && scene.photos?.length) {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + scene.photos!.length) % scene.photos!.length,
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, scene.photos]);

  const stopAmbientAudio = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setSoundPlaying(false);
  };

  useEffect(() => stopAmbientAudio, []);

  const startAmbientAudio = () => {
    if (scene.card.audioTrackId === "silent" || typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const chordNotes =
      scene.card.audioTrackId === "warm-piano"
        ? [261.63, 329.63, 392.0, 493.88, 523.25]
        : scene.card.audioTrackId === "gentle-strings"
          ? [220.0, 277.18, 329.63, 440.0, 493.88]
          : [293.66, 369.99, 440.0, 587.33, 659.25];

    let step = 0;
    const playSoftNote = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = scene.card.audioTrackId === "gentle-strings" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(chordNotes[step % chordNotes.length]!, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.5);
      step += 1;
    };

    playSoftNote();
    timerRef.current = window.setInterval(playSoftNote, 1800);
    setSoundPlaying(true);
  };

  const handleOpenSeal = () => {
    setOpened(true);
    trackPrivacySafeEvent("bouquet_unboxed");
    if (scene.card.audioTrackId !== "silent" && !soundPlaying) {
      startAmbientAudio();
    }
  };

  const handleReplayReveal = () => {
    stopAmbientAudio();
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
    }
    setVoicePlaying(false);
    setOpened(false);
  };

  const toggleVoicePlayback = async () => {
    const audioEl = voiceAudioRef.current;
    if (!audioEl) return;
    if (voicePlaying) {
      audioEl.pause();
      setVoicePlaying(false);
      return;
    }
    // Pause background ambient chime while the personal voice note plays
    if (soundPlaying) stopAmbientAudio();
    try {
      await audioEl.play();
      setVoicePlaying(true);
    } catch {
      setVoicePlaying(false);
    }
  };

  const handleDownloadKeepsake = async (mime: "image/png" | "image/jpeg") => {
    setDownloadingFmt(mime === "image/png" ? "png" : "jpg");
    try {
      const res = await exportBouquetBlob(scene, CATALOG_META_MAP, {
        aspect: "portrait",
        mimeType: mime,
        includeCardNote: !scene.card.isVisualOnly,
        includeColophon: scene.showColophon,
      });
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } finally {
      setDownloadingFmt(null);
    }
  };

  const handleCopyShareUrl = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/b/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const fonts = useMemo(() => getCardFontFamilies(scene.card.fontPairingId), [scene.card.fontPairingId]);
  const cardAppearance = useMemo(() => resolveCardAppearance(scene.card), [scene.card]);
  const animateReveal = scene.card.enableAnimatedReveal !== false && !prefersReducedMotion;
  const occasionMeta = scene.occasionTag ? OCCASION_TEMPLATES[scene.occasionTag] : undefined;
  const photos = scene.photos ?? [];
  const activeLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] ?? null : null;

  const isDarkSurface = scene.presentation.tableSurfaceId === "slate";
  const surfaceThemeVars = isDarkSurface
    ? ({
        "--bg-canvas": "#1B1D1B",
        "--bg-surface": "#262B27",
        "--bg-subtle": "#2E342F",
        "--text-primary": "#F5F2EB",
        "--text-secondary": "#CFCAC0",
        "--text-muted": "#A6A095",
        "--border-hairline": "rgba(245, 242, 235, 0.16)",
      } as React.CSSProperties)
    : undefined;

  if (!opened) {
    return (
      <div
        style={surfaceThemeVars}
        className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-canvas)] px-5 py-12 text-center text-[var(--text-primary)]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          {occasionMeta ? `${occasionMeta.label} • Petal & Prose Delivery` : "Petal & Prose Delivery"}
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium text-[var(--text-primary)] md:text-5xl">
          {scene.card.recipientName
            ? `A bouquet for ${scene.card.recipientName}`
            : title || "Someone sent you hand-arranged blooms"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          Tap the wax seal below to unbox your bespoke digital arrangement and read your keepsake note.
        </p>

        {/* Monogram Wax Envelope Card */}
        <button
          type="button"
          onClick={handleOpenSeal}
          data-testid="open-envelope-btn"
          className="group relative mt-10 flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-8 py-14 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <span
            className={`flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/40 font-display text-2xl font-semibold text-white shadow-md transition group-hover:scale-105 ${
              animateReveal ? "envelope-float" : ""
            }`}
            style={{ backgroundColor: WAX_HEX[scene.card.waxSealColorId] }}
          >
            P&amp;P
          </span>
          <span className="mt-5 text-sm font-semibold text-[var(--accent-primary)]">
            Break Seal &amp; Unwrap Bouquet →
          </span>
          {!scene.hideNamesInPreview && scene.card.senderName && (
            <span className="mt-1 text-xs text-[var(--text-muted)]">
              From {scene.card.senderName}
            </span>
          )}
          {(photos.length > 0 || scene.voiceMessage) && (
            <span className="mt-3 inline-flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
              {photos.length > 0 && (
                <span className="rounded-full bg-[var(--accent-primary)]/10 px-2.5 py-0.5">
                  {photos.length} {photos.length === 1 ? "photo enclosed" : "photos enclosed"}
                </span>
              )}
              {scene.voiceMessage && (
                <span className="rounded-full bg-[var(--accent-primary)]/10 px-2.5 py-0.5">
                  Voice note enclosed
                </span>
              )}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      style={surfaceThemeVars}
      className="min-h-[100dvh] bg-[var(--bg-canvas)] text-[var(--text-primary)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 md:px-8">
        <Link href="/" className="font-display text-lg font-semibold">
          Petal &amp; Prose
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {scene.card.enableAnimatedReveal !== false && (
            <button
              type="button"
              onClick={handleReplayReveal}
              data-testid="replay-reveal-btn"
              className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)]"
            >
              Replay Reveal
            </button>
          )}
          {scene.card.audioTrackId !== "silent" && (
            <button
              type="button"
              data-testid="ambient-audio-toggle"
              onClick={() => (soundPlaying ? stopAmbientAudio() : startAmbientAudio())}
              className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
            >
              {soundPlaying ? "Mute Chime" : "Play Chime"}
            </button>
          )}
          <Link
            href="/studio"
            className="rounded-full bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-semibold text-white"
          >
            Send One Back
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-8 md:grid-cols-12 md:px-8 md:py-12">
        <div className="md:col-span-7">
          <div
            data-testid="unboxing-bouquet-stage"
            data-animated={animateReveal ? "true" : "false"}
            className={`overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-md ${
              animateReveal ? "petal-reveal petal-sway" : ""
            }`}
          >
            <BouquetCanvasDisplay
              scene={scene}
              width={900}
              height={1080}
              includeColophon={scene.showColophon}
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        <div className="space-y-6 md:col-span-5">
          {!scene.card.isVisualOnly && (
            <article
              data-testid="unboxing-card"
              className={`relative overflow-hidden rounded-2xl border p-7 shadow-sm ${
                animateReveal ? "card-reveal" : ""
              }`}
              style={{
                backgroundColor: cardAppearance.backgroundColor,
                color: cardAppearance.textColor,
                borderColor: cardAppearance.borderColor,
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
                className="text-sm"
                style={{ fontFamily: fonts.displayFont, color: cardAppearance.mutedColor }}
              >
                {scene.card.recipientName ? `Dearest ${scene.card.recipientName},` : "For you,"}
              </p>
              <p
                className="mt-5 whitespace-pre-wrap text-lg leading-relaxed"
                style={{ fontFamily: fonts.bodyFont }}
              >
                {scene.card.message}
              </p>
              {scene.card.senderName && !scene.hideNamesInPreview && (
                <p
                  className="mt-6 text-sm"
                  style={{ fontFamily: fonts.displayFont, color: cardAppearance.mutedColor }}
                >
                  With warmth, {scene.card.senderName}
                </p>
              )}
            </article>
          )}

          {scene.voiceMessage && (
            <section
              data-testid="unboxing-voice-player"
              className={`rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 shadow-sm ${
                animateReveal ? "card-reveal" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-medium text-[var(--text-primary)]">
                    Personal Voice Note
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {formatDuration(voiceTimeSec)} / {formatDuration(scene.voiceMessage.durationSec)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleVoicePlayback}
                  data-testid="unboxing-voice-play-btn"
                  className="rounded-full bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
                >
                  {voicePlaying ? "Pause Note" : "Play Voice Note"}
                </button>
              </div>
              <audio
                ref={voiceAudioRef}
                controls
                preload="metadata"
                src={scene.voiceMessage.url}
                onPlay={() => {
                  if (soundPlaying) stopAmbientAudio();
                  setVoicePlaying(true);
                }}
                onPause={() => setVoicePlaying(false)}
                onEnded={() => {
                  setVoicePlaying(false);
                  setVoiceTimeSec(0);
                }}
                onTimeUpdate={(e) => setVoiceTimeSec(e.currentTarget.currentTime)}
                className="mt-3 h-9 w-full"
              />
            </section>
          )}

          {photos.length > 0 && (
            <section
              data-testid="unboxing-photo-gallery"
              className={`rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 shadow-sm ${
                animateReveal ? "card-reveal" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-medium text-[var(--text-primary)]">
                  Keepsake Photo Gallery
                </h2>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {photos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    type="button"
                    data-testid={`unboxing-photo-thumb-${idx}`}
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-left transition hover:border-[var(--accent-primary)]"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || `Keepsake memory ${idx + 1}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    {photo.caption && (
                      <p className="truncate bg-white/95 px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
                        {photo.caption}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Botanical Meanings Legend */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
            <h2 className="font-display text-lg font-medium">Included in This Arrangement</h2>
            <ul className="mt-3 space-y-2 text-xs text-[var(--text-secondary)]">
              {Array.from(new Set(scene.stems.map((s) => s.skuId))).map((skuId) => {
                const meta = CATALOG_META_MAP.get(skuId);
                if (!meta) return null;
                return (
                  <li key={skuId} className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--text-primary)]">{meta.name}</span>
                    <span className="truncate text-[var(--text-muted)]">{meta.meaningShort}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={downloadingFmt !== null}
              onClick={() => handleDownloadKeepsake("image/png")}
              className="rounded-xl border border-[var(--accent-primary)] bg-[var(--bg-surface)] py-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary-hover)] disabled:opacity-60"
            >
              {downloadingFmt === "png" ? "Exporting PNG…" : "Download PNG"}
            </button>
            <button
              type="button"
              disabled={downloadingFmt !== null}
              onClick={() => handleDownloadKeepsake("image/jpeg")}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] py-3 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] disabled:opacity-60"
            >
              {downloadingFmt === "jpg" ? "Exporting JPG…" : "Download JPG"}
            </button>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] py-2.5 text-xs font-semibold text-[var(--text-primary)]"
            >
              {copied ? "Copied Link!" : "Copy Share Link"}
            </button>
            <Link
              href="/studio"
              className="flex-1 rounded-xl bg-[var(--accent-primary)] py-2.5 text-center text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)]"
            >
              Arrange Another Bouquet
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border-hairline)] px-4 py-5 text-center text-xs text-[var(--text-muted)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4">
          <span>Private Keepsake Delivery by Petal &amp; Prose</span>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
          <Link href="/contact?topic=moderation" className="underline-offset-4 hover:underline">
            Report or Remove Bouquet
          </Link>
        </div>
      </footer>

      {activeLightboxPhoto && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keepsake photo preview"
          data-testid="unboxing-photo-lightbox"
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#1B1D1B] p-4 text-white shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs text-white/75">
                Photo {lightboxIndex + 1} of {photos.length}
              </span>
              <button
                type="button"
                data-testid="unboxing-lightbox-close"
                onClick={() => setLightboxIndex(null)}
                className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="flex max-h-[68vh] items-center justify-center overflow-hidden rounded-xl bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeLightboxPhoto.url}
                alt={activeLightboxPhoto.caption || `Keepsake memory ${lightboxIndex + 1}`}
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-white/85">
                {activeLightboxPhoto.caption || "Enclosed memory"}
              </p>
              {photos.length > 1 && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)
                    }
                    className="rounded-full border border-white/25 px-3 py-1 text-xs hover:bg-white/10"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
                    className="rounded-full border border-white/25 px-3 py-1 text-xs hover:bg-white/10"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
