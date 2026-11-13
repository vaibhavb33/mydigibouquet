"use client";

import React, { useEffect, useRef, useState } from "react";
import { BouquetSceneV1 } from "@/engine/types";
import { CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { createBrowserAssetStore, renderBouquetToContext2D } from "@/engine/canvas-renderer";

export function BouquetCanvasDisplay({
  scene,
  width = 800,
  height = 960,
  className = "",
  includeColophon = false,
}: {
  scene: BouquetSceneV1;
  width?: number;
  height?: number;
  className?: string;
  includeColophon?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    const store = createBrowserAssetStore();
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    void renderBouquetToContext2D(offCtx, width, height, scene, CATALOG_META_MAP, store, {
      aspect: "portrait",
      mimeType: "image/png",
      includeColophon,
      includeCardNote: false,
      useExportLod: false,
    }).then(() => {
      if (!cancelled) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(offscreen, 0, 0, width, height);
        setHasRenderedOnce(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [height, includeColophon, scene, width]);

  return (
    <div className="relative h-full w-full min-w-0 overflow-hidden">
      {!hasRenderedOnce && (
        <div
          aria-hidden="true"
          data-testid="bouquet-skeleton"
          className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-well)]/75 animate-pulse"
        >
          <div className="h-24 w-24 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)]/80" />
          <div className="mt-3 h-16 w-12 rounded-t-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]/70" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-label="Rendered digital bouquet arrangement"
        className={`block h-full w-full object-contain transition-opacity duration-300 ${hasRenderedOnce ? "opacity-100" : "opacity-0"} ${className}`}
      />
    </div>
  );
}

