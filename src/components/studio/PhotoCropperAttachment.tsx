"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ALLOWED_PHOTO_MIMES, MAX_PHOTOS_PER_BOUQUET } from "@/lib/media-validation";
import { useStudioScene } from "./StudioSceneProvider";

type AspectChoice = {
  id: "portrait" | "square" | "landscape";
  label: string;
  ratio: number;
};

const ASPECT_CHOICES: readonly AspectChoice[] = [
  { id: "portrait", label: "4:5 Frame", ratio: 0.8 },
  { id: "square", label: "1:1 Square", ratio: 1 },
  { id: "landscape", label: "3:2 Card", ratio: 1.5 },
];

type PendingCropItem = {
  file: File;
  objectUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  imageEl: HTMLImageElement;
};

export function PhotoCropperAttachment() {
  const { scene, addPhotoAttachment, updatePhotoCaption, removePhotoAttachment } = useStudioScene();
  const photos = scene.photos ?? [];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [queue, setQueue] = useState<File[]>([]);
  const [activeItem, setActiveItem] = useState<PendingCropItem | null>(null);
  const [aspectId, setAspectId] = useState<AspectChoice["id"]>("square");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0); // -1 .. +1 normalized pan
  const [offsetY, setOffsetY] = useState(0);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dragRef = useRef<{ active: boolean; startX: number; startY: number; ox: number; oy: number }>({
    active: false,
    startX: 0,
    startY: 0,
    ox: 0,
    oy: 0,
  });

  const aspectRatio = ASPECT_CHOICES.find((a) => a.id === aspectId)?.ratio ?? 1;

  const loadNextFromQueue = useCallback((filesToProcess: File[]) => {
    if (filesToProcess.length === 0) {
      setActiveItem((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return null;
      });
      return;
    }

    const [nextFile, ...rest] = filesToProcess;
    if (!nextFile) return;

    const url = URL.createObjectURL(nextFile);
    const img = new Image();
    img.onload = () => {
      setActiveItem((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return {
          file: nextFile,
          objectUrl: url,
          naturalWidth: img.naturalWidth || 800,
          naturalHeight: img.naturalHeight || 800,
          imageEl: img,
        };
      });
      setQueue(rest);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setCaption("");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMsg(`Could not read image "${nextFile.name}". Try JPEG, PNG, or WebP.`);
      setQueue(rest);
      loadNextFromQueue(rest);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    return () => {
      if (activeItem) URL.revokeObjectURL(activeItem.objectUrl);
    };
  }, [activeItem]);

  const computeSourceCropRect = useCallback(
    (item: PendingCropItem) => {
      const imgAspect = item.naturalWidth / item.naturalHeight;
      let baseW = item.naturalWidth;
      let baseH = item.naturalHeight;
      if (imgAspect > aspectRatio) {
        baseW = item.naturalHeight * aspectRatio;
      } else {
        baseH = item.naturalWidth / aspectRatio;
      }

      const cropW = baseW / zoom;
      const cropH = baseH / zoom;
      const maxPanX = Math.max(0, (item.naturalWidth - cropW) / 2);
      const maxPanY = Math.max(0, (item.naturalHeight - cropH) / 2);

      const sx = (item.naturalWidth - cropW) / 2 - offsetX * maxPanX;
      const sy = (item.naturalHeight - cropH) / 2 - offsetY * maxPanY;

      return {
        sx: Math.max(0, Math.min(item.naturalWidth - cropW, sx)),
        sy: Math.max(0, Math.min(item.naturalHeight - cropH, sy)),
        sw: cropW,
        sh: cropH,
      };
    },
    [aspectRatio, offsetX, offsetY, zoom],
  );

  // Redraw crop preview canvas live whenever zoom/pan/aspect changes
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !activeItem) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previewW = 320;
    const previewH = Math.round(previewW / aspectRatio);
    canvas.width = previewW;
    canvas.height = previewH;

    const { sx, sy, sw, sh } = computeSourceCropRect(activeItem);
    ctx.clearRect(0, 0, previewW, previewH);
    ctx.drawImage(activeItem.imageEl, sx, sy, sw, sh, 0, 0, previewW, previewH);

    // Subtle rule-of-thirds crop guide lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(previewW / 3, 0);
    ctx.lineTo(previewW / 3, previewH);
    ctx.moveTo((previewW * 2) / 3, 0);
    ctx.lineTo((previewW * 2) / 3, previewH);
    ctx.moveTo(0, previewH / 3);
    ctx.lineTo(previewW, previewH / 3);
    ctx.moveTo(0, (previewH * 2) / 3);
    ctx.lineTo(previewW, (previewH * 2) / 3);
    ctx.stroke();
  }, [activeItem, aspectRatio, computeSourceCropRect]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (chosen.length === 0) return;

    const remainingSlots = MAX_PHOTOS_PER_BOUQUET - photos.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Maximum ${MAX_PHOTOS_PER_BOUQUET} photos allowed per bouquet.`);
      return;
    }

    const validFiles: File[] = [];
    for (const f of chosen) {
      if (!ALLOWED_PHOTO_MIMES.includes(f.type as (typeof ALLOWED_PHOTO_MIMES)[number])) {
        setErrorMsg(`"${f.name}" is not a supported image type. Use JPEG, PNG, or WebP.`);
        continue;
      }
      if (f.size > 12 * 1024 * 1024) {
        setErrorMsg(`"${f.name}" exceeds the 12 MB pre-crop file size limit.`);
        continue;
      }
      validFiles.push(f);
    }

    const capped = validFiles.slice(0, remainingSlots);
    if (capped.length > 0) {
      loadNextFromQueue(capped);
    }
  };

  const handleConfirmCropUpload = async () => {
    if (!activeItem) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const outW = aspectRatio >= 1 ? 1080 : 960;
      const outH = Math.round(outW / aspectRatio);
      const offscreen = document.createElement("canvas");
      offscreen.width = outW;
      offscreen.height = outH;
      const ctx = offscreen.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable.");

      const { sx, sy, sw, sh } = computeSourceCropRect(activeItem);
      ctx.drawImage(activeItem.imageEl, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Could not encode cropped photo."))),
          "image/jpeg",
          0.9,
        );
      });

      const form = new FormData();
      form.append("kind", "photo");
      form.append("file", new File([blob], "cropped-photo.jpg", { type: "image/jpeg" }));

      const res = await fetch("/api/media", { method: "POST", body: form });
      const data = (await res.json()) as { id?: string; url?: string; error?: string };
      if (!res.ok || !data.id || !data.url) {
        throw new Error(data.error ?? "Photo upload failed");
      }

      addPhotoAttachment({
        id: data.id,
        url: data.url,
        caption: caption.trim() || undefined,
        aspectRatio,
      });

      if (queue.length > 0) {
        loadNextFromQueue(queue);
      } else {
        setActiveItem((prev) => {
          if (prev) URL.revokeObjectURL(prev.objectUrl);
          return null;
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save cropped photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setActiveItem((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    setQueue([]);
  };

  return (
    <div
      data-testid="photo-attachments-section"
      className="rounded-xl border border-[var(--border-hairline)] bg-white p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Keepsake Photos ({photos.length}/{MAX_PHOTOS_PER_BOUQUET})
          </h4>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Upload &amp; crop memories to display beside your letter.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-photo-btn"
          disabled={photos.length >= MAX_PHOTOS_PER_BOUQUET}
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[32px] shrink-0 rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] px-2.5 text-[11px] font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white disabled:opacity-45"
        >
          + Add Photos
        </button>
        <input
          ref={fileInputRef}
          data-testid="photo-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>

      {errorMsg && (
        <p
          data-testid="photo-error"
          role="alert"
          className="rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-fill)] px-2.5 py-1.5 text-[11px] text-[var(--status-error-ink)]"
        >
          {errorMsg}
        </p>
      )}

      {photos.length > 0 && (
        <div data-testid="attached-photos-list" className="grid grid-cols-2 gap-2 pt-1">
          {photos.map((photo) => (
            <div
              key={photo.id}
              data-testid={`attached-photo-${photo.id}`}
              className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1.5 space-y-1.5"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded bg-[var(--bg-well)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption || "Attached keepsake"}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  data-testid={`remove-photo-btn-${photo.id}`}
                  aria-label="Remove attached photo"
                  onClick={() => removePhotoAttachment(photo.id)}
                  className="absolute top-1 right-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-black"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                maxLength={80}
                value={photo.caption ?? ""}
                onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                placeholder="Caption (optional)"
                className="w-full rounded border border-[var(--border-hairline)] bg-white px-1.5 py-1 text-[10px]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Interactive Photo Cropper Modal */}
      {activeItem && (
        <div
          data-testid="photo-crop-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Crop keepsake photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium">Crop Keepsake Photo</h3>
              <span className="text-[11px] text-[var(--text-muted)]">
                {queue.length > 0 ? `+${queue.length} more queued` : "Drag image to reposition"}
              </span>
            </div>

            <div className="flex justify-center rounded-xl bg-[#181A18] p-3">
              <canvas
                ref={previewCanvasRef}
                data-testid="crop-preview-canvas"
                onPointerDown={(e) => {
                  dragRef.current = {
                    active: true,
                    startX: e.clientX,
                    startY: e.clientY,
                    ox: offsetX,
                    oy: offsetY,
                  };
                }}
                onPointerMove={(e) => {
                  if (!dragRef.current.active) return;
                  const dx = (e.clientX - dragRef.current.startX) / 140;
                  const dy = (e.clientY - dragRef.current.startY) / 140;
                  setOffsetX(Math.max(-1, Math.min(1, dragRef.current.ox + dx)));
                  setOffsetY(Math.max(-1, Math.min(1, dragRef.current.oy + dy)));
                }}
                onPointerUp={() => {
                  dragRef.current.active = false;
                }}
                onPointerLeave={() => {
                  dragRef.current.active = false;
                }}
                className="max-h-[280px] cursor-grab touch-none rounded border border-white/20 active:cursor-grabbing"
              />
            </div>

            <div className="flex gap-1.5">
              {ASPECT_CHOICES.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  data-testid={`crop-aspect-${choice.id}`}
                  onClick={() => setAspectId(choice.id)}
                  className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium ${
                    aspectId === choice.id
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] font-semibold"
                      : "border-[var(--border-hairline)] bg-white text-[var(--text-secondary)]"
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Crop Zoom</span>
                <span className="font-mono">{zoom.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                data-testid="crop-zoom-slider"
                min={1}
                max={2.6}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-primary)]"
              />
            </label>

            <input
              type="text"
              data-testid="photo-caption-input"
              maxLength={80}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional photo memory caption…"
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 py-2 text-xs"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="min-h-[36px] rounded-lg border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="crop-save-btn"
                disabled={uploading}
                onClick={handleConfirmCropUpload}
                className="min-h-[36px] rounded-lg bg-[var(--accent-primary)] px-4 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Save & Attach Photo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

