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
    resetArrangement,
    updateStemsTransform,
  } = useStudioScene();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<BouquetKonvaStage | null>(null);

  const onSelectRef = useRef(setSelectedIds);
  const onCommitRef = useRef(updateStemsTransform);
  const inspectRef = useRef(onRequestInspectTab);
  onSelectRef.current = setSelectedIds;
  onCommitRef.current = updateStemsTransform;
  inspectRef.current = onRequestInspectTab;

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
  const anySelectedLocked = scene.stems
    .filter((s) => selectedIds.includes(s.id))
    .some((s) => Boolean(s.locked));
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
          className={`absolute top-3 left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-md backdrop-blur-md ${
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

      {/* Main Centered Konva Bouquet Stage Container */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center p-2 md:p-4">
        <div
          ref={containerRef}
          data-testid="bouquet-konva-container"
          aria-label="Interactive digital bouquet composition canvas"
          className="relative flex h-full w-full max-w-[640px] items-center justify-center [&_.konvajs-content]:mx-auto"
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
          Reset Arrange
        </button>
      </div>
    </div>
  );
}

