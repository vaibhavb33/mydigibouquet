"use client";

import React, { useEffect, useRef } from "react";
import { BouquetKonvaStage } from "@/engine/konva-stage";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { useStudioScene } from "./StudioSceneProvider";

const SURFACE_CLASSES = {
  linen: "surface-linen",
  limewash: "surface-limewash",
  travertine: "surface-travertine",
  slate: "surface-slate",
} as const;

export function StudioCanvasViewport({
  onRequestInspectTab,
}: {
  onRequestInspectTab?: () => void;
}) {
  const {
    scene,
    selectedIds,
    overlapCandidates,
    multiSelectMode,
    canUndo,
    canRedo,
    notice,
    clearNotice,
    setSelectedIds,
    toggleMultiSelectMode,
    cycleOverlappingStem,
    undo,
    redo,
    bringForward,
    sendBackward,
    toggleLockStems,
    duplicateStems,
    removeStems,
    flipStemsHorizontal,
    resetArrangement,
    updateStemsTransform,
  } = useStudioScene();

  const [zoomLevel, setZoomLevel] = React.useState(1.0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<BouquetKonvaStage | null>(null);

  const onSelectRef = useRef(setSelectedIds);
  const onCommitRef = useRef(updateStemsTransform);
  const inspectRef = useRef(onRequestInspectTab);
  onSelectRef.current = setSelectedIds;
  onCommitRef.current = updateStemsTransform;
  inspectRef.current = onRequestInspectTab;

  const handleZoomChange = (nextZoom: number) => {
    const clamped = Math.max(0.6, Math.min(2.0, Number(nextZoom.toFixed(2))));
    setZoomLevel(clamped);
    stageRef.current?.setZoom(clamped);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = new BouquetKonvaStage(el, {
      onSelect: (ids, overlaps) => {
        onSelectRef.current(ids, overlaps);
        if (ids.length > 0 && inspectRef.current) {
          inspectRef.current();
        }
      },
      onCommit: (updates) => onCommitRef.current(updates),
    });

    stageRef.current = instance;
    return () => {
      instance.destroy();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => {
    stageRef.current?.syncScene(scene, CATALOG_META_MAP, selectedIds);
  }, [scene, selectedIds]);

  useEffect(() => {
    stageRef.current?.setMultiSelectMode(multiSelectMode);
  }, [multiSelectMode]);

  const hasSelection = selectedIds.length > 0;
  const selectedStems = scene.stems.filter((s) => selectedIds.includes(s.id));
  const primarySelected = selectedStems[0];
  const primaryMeta = primarySelected ? CATALOG_META_MAP.get(primarySelected.skuId) : null;
  const anySelectedLocked = selectedStems.some((s) => Boolean(s.locked));
  const surfaceClass = SURFACE_CLASSES[scene.presentation.tableSurfaceId];

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-between overflow-hidden transition-colors duration-300 ${surfaceClass}`}
      data-surface={scene.presentation.tableSurfaceId}
    >
      {/* Top Status / Notification Toast */}
      {notice && (
        <div
          role="status"
          className={`absolute top-3 left-1/2 z-30 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-md backdrop-blur-md ${
            notice.tone === "warning"
              ? "border-[var(--status-warning-border)] bg-[var(--status-warning-fill)] text-[var(--status-warning-ink)]"
              : notice.tone === "error"
                ? "border-[var(--status-error-border)] bg-[var(--status-error-fill)] text-[var(--status-error-ink)]"
                : notice.tone === "success"
                  ? "border-[var(--status-success-border)] bg-[var(--status-success-fill)] text-[var(--status-success-ink)]"
                  : "border-[var(--border-hairline)] bg-white/95 text-[var(--text-primary)]"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={clearNotice}
            aria-label="Dismiss message"
            className="ml-1 rounded-full px-1 font-bold opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Floating Canvas Zoom Controls */}
      <div
        role="group"
        aria-label="Canvas zoom controls"
        className="absolute top-3 right-3 z-20 flex items-center gap-0.5 rounded-full border border-[var(--border-hairline)] bg-white/90 p-1 shadow-xs backdrop-blur-xs text-[var(--text-primary)]"
      >
        <button
          type="button"
          onClick={() => handleZoomChange(zoomLevel - 0.15)}
          disabled={zoomLevel <= 0.65}
          title="Zoom out"
          aria-label="Zoom out"
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold hover:bg-[var(--bg-well)] disabled:opacity-35"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => handleZoomChange(1.0)}
          title="Reset zoom to 100%"
          className="px-2 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={() => handleZoomChange(zoomLevel + 0.15)}
          disabled={zoomLevel >= 1.95}
          title="Zoom in"
          aria-label="Zoom in"
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold hover:bg-[var(--bg-well)] disabled:opacity-35"
        >
          +
        </button>
      </div>

      {/* Clear Selected-Object Indicator Bar */}
      {hasSelection ? (
        <div
          role="region"
          aria-label="Selected stem controls"
          className="absolute top-3 left-3 sm:left-1/2 sm:-translate-x-1/2 z-20 flex max-w-[92%] flex-wrap items-center gap-1 rounded-full border border-[var(--accent-primary)]/40 bg-white/95 px-2.5 py-1 text-xs shadow-md backdrop-blur-xs"
        >
          <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)] pr-1">
            {primaryMeta && (
              <span
                className="h-2.5 w-2.5 rounded-full border border-black/15"
                style={{ backgroundColor: primaryMeta.colorHex }}
              />
            )}
            <span className="truncate max-w-[120px] sm:max-w-[180px]">
              {selectedStems.length === 1 && primaryMeta
                ? primaryMeta.name
                : `${selectedStems.length} stems`}
            </span>
          </span>

          <span aria-hidden="true" className="h-3.5 w-px bg-[var(--border-hairline)]" />

          <button
            type="button"
            title="Rotate -15°"
            onClick={() => {
              updateStemsTransform(
                selectedStems.map((s) => ({
                  id: s.id,
                  x: s.x,
                  y: s.y,
                  scale: s.scale,
                  rotationDeg: s.rotationDeg - 15,
                })),
              );
            }}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
          >
            ↺ -15°
          </button>
          <button
            type="button"
            title="Rotate +15°"
            onClick={() => {
              updateStemsTransform(
                selectedStems.map((s) => ({
                  id: s.id,
                  x: s.x,
                  y: s.y,
                  scale: s.scale,
                  rotationDeg: s.rotationDeg + 15,
                })),
              );
            }}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
          >
            ↻ +15°
          </button>
          <button
            type="button"
            title="Flip stem"
            onClick={() => flipStemsHorizontal()}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-well)] hover:text-[var(--text-primary)]"
          >
            ⇄ Flip
          </button>
          <button
            type="button"
            title="Delete selected"
            onClick={() => removeStems()}
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--status-error-ink)] hover:bg-[var(--status-error-fill)]"
          >
            Delete
          </button>
          <button
            type="button"
            title="Deselect"
            onClick={() => setSelectedIds([])}
            className="rounded-full px-1.5 py-0.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>
      ) : (
        <p className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--border-hairline)] bg-white/85 px-3 py-1 text-[11px] text-[var(--text-secondary)] shadow-2xs backdrop-blur-xs">
          Click or tap any bloom to move, rotate, scale or style
        </p>
      )}

      {/* Main Centered Konva Bouquet Stage Container */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center p-2 md:p-4">
        <div
          ref={containerRef}
          data-testid="bouquet-konva-container"
          aria-label="Interactive digital bouquet composition canvas"
          className="relative flex h-full w-full max-w-[880px] items-center justify-center [&_.konvajs-content]:mx-auto"
        />
      </div>

      {/* Floating Bottom Atelier Control Dock */}
      <div className="z-20 mb-2 flex max-w-[96%] flex-wrap items-center justify-center gap-1 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]/95 px-2.5 py-1.5 text-[var(--text-primary)] shadow-md backdrop-blur-md md:mb-3">
        <button
          type="button"
          data-testid="toolbar-undo"
          disabled={!canUndo}
          onClick={undo}
          title="Undo (Cmd/Ctrl+Z)"
          className="min-h-[36px] rounded-lg px-2.5 text-xs font-medium hover:bg-[var(--bg-well)] disabled:opacity-35"
        >
          Undo
        </button>
        <button
          type="button"
          data-testid="toolbar-redo"
          disabled={!canRedo}
          onClick={redo}
          title="Redo (Cmd/Ctrl+Shift+Z)"
          className="min-h-[36px] rounded-lg px-2.5 text-xs font-medium hover:bg-[var(--bg-well)] disabled:opacity-35"
        >
          Redo
        </button>

        <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-[var(--border-hairline)]" />

        <button
          type="button"
          data-testid="toolbar-multiselect"
          aria-pressed={multiSelectMode}
          onClick={toggleMultiSelectMode}
          className={`min-h-[36px] rounded-lg px-2.5 text-xs font-medium transition ${
            multiSelectMode
              ? "bg-[var(--accent-primary)] text-white"
              : "hover:bg-[var(--bg-well)]"
          }`}
        >
          Multi{hasSelection && selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}
        </button>

        {hasSelection && (
          <>
            <button
              type="button"
              data-testid="toolbar-forward"
              onClick={() => bringForward()}
              className="min-h-[36px] rounded-lg px-2.5 text-xs font-medium hover:bg-[var(--bg-well)]"
            >
              Forward
            </button>
            <button
              type="button"
              data-testid="toolbar-backward"
              onClick={() => sendBackward()}
              className="min-h-[36px] rounded-lg px-2.5 text-xs font-medium hover:bg-[var(--bg-well)]"
            >
              Back
            </button>
            <button
              type="button"
              data-testid="toolbar-lock"
              aria-pressed={anySelectedLocked}
              onClick={() => toggleLockStems()}
              className={`min-h-[36px] rounded-lg px-2.5 text-xs font-medium ${
                anySelectedLocked
                  ? "bg-[var(--text-primary)] text-white"
                  : "hover:bg-[var(--bg-well)]"
              }`}
            >
              {anySelectedLocked ? "Unlock" : "Lock"}
            </button>
            <button
              type="button"
              data-testid="toolbar-duplicate"
              onClick={() => duplicateStems()}
              className="min-h-[36px] rounded-lg px-2.5 text-xs font-medium hover:bg-[var(--bg-well)]"
            >
              Duplicate
            </button>
            {overlapCandidates.length > 1 && (
              <button
                type="button"
                data-testid="toolbar-cycle"
                onClick={cycleOverlappingStem}
                className="min-h-[36px] rounded-lg bg-[var(--accent-primary-soft)] px-2.5 text-xs font-semibold text-[var(--accent-primary)]"
              >
                Next Stem
              </button>
            )}
            <button
              type="button"
              data-testid="toolbar-delete"
              onClick={() => removeStems()}
              className="min-h-[36px] rounded-lg px-2.5 text-xs font-medium text-[var(--status-error-ink)] hover:bg-[var(--status-error-fill)]"
            >
              Remove
            </button>
          </>
        )}

        <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-[var(--border-hairline)]" />

        <button
          type="button"
          data-testid="toolbar-reset"
          onClick={resetArrangement}
          className="min-h-[36px] rounded-lg px-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-well)]"
        >
          Auto-Arrange
        </button>
      </div>
    </div>
  );
}

