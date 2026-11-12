import Konva from "konva";
import {
  BotanicalMeta,
  BouquetSceneV1,
  COLLAR_ANCHOR_X,
  StemInstance,
  VESSEL_RULES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./types";
import { getPocketClipPath, isFrontDrapeStem, resolveBowAssetPath } from "./canvas-renderer";
import { getSyncHitMask, hitTestDecodedMask, preloadHitMask } from "./hit-mask";

export type StageSelectionCallback = (selectedIds: string[], cycleCandidates?: string[]) => void;
export type StageStemsCommitCallback = (
  updates: Array<{ id: string; x: number; y: number; scale: number; rotationDeg: number }>,
) => void;

type LoadedKonvaImageMap = Map<string, HTMLImageElement>;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return Number(d.toFixed(1));
}

export class BouquetKonvaStage {
  private container: HTMLElement;
  private stage: Konva.Stage;
  private backLayer: Konva.Layer;
  private vesselFrontLayer: Konva.Layer;
  private activeDragLayer: Konva.Layer;
  private selectionLayer: Konva.Layer;

  private shadowEllipse: Konva.Ellipse;
  private vesselBackImage: Konva.Image;
  private stemClipGroup: Konva.Group;
  private vesselFrontImage: Konva.Image;
  private frontDrapeGroup: Konva.Group;
  private bowImage: Konva.Image;
  private transformer: Konva.Transformer;
  private lockBadgesGroup: Konva.Group;
  private proxiesGroup: Konva.Group;

  private stemNodes = new Map<string, Konva.Image>();
  private bloomProxies = new Map<string, Konva.Rect>();
  private imageCache: LoadedKonvaImageMap = new Map();
  private inFlightLoads = new Map<string, Promise<HTMLImageElement | null>>();
  private resizeObserver: ResizeObserver;

  private currentScene: BouquetSceneV1 | null = null;
  private metaMap: ReadonlyMap<string, BotanicalMeta> = new Map();
  private selectedIds: string[] = [];
  private multiSelectActive = false;
  private onSelect: StageSelectionCallback;
  private onCommit: StageStemsCommitCallback;
  private destroyed = false;

  constructor(
    container: HTMLElement,
    options: {
      onSelect: StageSelectionCallback;
      onCommit: StageStemsCommitCallback;
    },
  ) {
    this.container = container;
    this.onSelect = options.onSelect;
    this.onCommit = options.onCommit;

    this.stage = new Konva.Stage({
      container: container as HTMLDivElement,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
    });

    this.backLayer = new Konva.Layer();
    this.vesselFrontLayer = new Konva.Layer();
    this.activeDragLayer = new Konva.Layer();
    this.selectionLayer = new Konva.Layer();

    this.shadowEllipse = new Konva.Ellipse({
      x: COLLAR_ANCHOR_X,
      y: 1085,
      radiusX: 205,
      radiusY: 34,
      fillRadialGradientStartPoint: { x: 0, y: 0 },
      fillRadialGradientStartRadius: 8,
      fillRadialGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientEndRadius: 205,
      fillRadialGradientColorStops: [0, "rgba(25,22,18,0.22)", 0.6, "rgba(25,22,18,0.08)", 1, "rgba(25,22,18,0)"],
      listening: false,
    });

    this.vesselBackImage = new Konva.Image({
      x: 0,
      y: 0,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      image: undefined,
      listening: false,
    });

    this.stemClipGroup = new Konva.Group();

    this.backLayer.add(this.shadowEllipse, this.vesselBackImage, this.stemClipGroup);

    this.vesselFrontImage = new Konva.Image({
      x: 0,
      y: 0,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      image: undefined,
      listening: false,
    });

    this.frontDrapeGroup = new Konva.Group();

    this.bowImage = new Konva.Image({
      x: COLLAR_ANCHOR_X - 160,
      y: 550,
      width: 320,
      height: 320,
      image: undefined,
      listening: false,
      shadowColor: "rgba(25,22,18,0.16)",
      shadowBlur: 12,
      shadowOffsetY: 5,
    });

    this.vesselFrontLayer.add(this.vesselFrontImage, this.frontDrapeGroup, this.bowImage);

    this.transformer = new Konva.Transformer({
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      keepRatio: true,
      rotateEnabled: true,
      resizeEnabled: true,
      rotateAnchorOffset: 28,
      anchorSize: 12,
      anchorCornerRadius: 6,
      anchorFill: "#FAF8F5",
      anchorStroke: "#24231F",
      anchorStrokeWidth: 1.5,
      borderStroke: "#35513D",
      borderStrokeWidth: 1.5,
      borderDash: [5, 4],
      padding: 4,
      boundBoxFunc: (oldBox, newBox) => {
        if (Math.abs(newBox.width) < 70 || Math.abs(newBox.height) < 70) {
          return oldBox;
        }
        return newBox;
      },
    });

    this.lockBadgesGroup = new Konva.Group({ listening: false });
    this.proxiesGroup = new Konva.Group({ listening: false });
    this.selectionLayer.add(this.proxiesGroup, this.lockBadgesGroup, this.transformer);

    this.stage.add(this.backLayer, this.vesselFrontLayer, this.activeDragLayer, this.selectionLayer);

    this.bindStageEvents();

    this.resizeObserver = new ResizeObserver(() => this.fitStageToContainer());
    this.resizeObserver.observe(this.container);
    this.fitStageToContainer();
  }

  public fitStageToContainer(): void {
    if (this.destroyed) return;
    const rect = this.container.getBoundingClientRect();
    const cw = Math.max(240, rect.width);
    const ch = Math.max(280, rect.height);
    const scale = Math.min(cw / WORLD_WIDTH, ch / WORLD_HEIGHT);
    const stageW = Math.round(WORLD_WIDTH * scale);
    const stageH = Math.round(WORLD_HEIGHT * scale);

    this.stage.width(stageW);
    this.stage.height(stageH);
    this.stage.scale({ x: scale, y: scale });
    this.stage.batchDraw();
  }

  public setMultiSelectMode(active: boolean): void {
    this.multiSelectActive = active;
  }

  public getSelectedIds(): string[] {
    return [...this.selectedIds];
  }

  public findStemsAtWorldPoint(worldX: number, worldY: number): string[] {
    if (!this.currentScene) return [];
    const sortedTopDown = [...this.currentScene.stems].sort((a, b) => b.zIndex - a.zIndex);
    const matches: string[] = [];

    for (const stem of sortedTopDown) {
      const meta = this.metaMap.get(stem.skuId);
      if (!meta) continue;
      const dx = worldX - stem.x;
      const dy = worldY - stem.y;
      const rad = (-stem.rotationDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;

      const localX = rx / (stem.scale * (stem.flippedX ? -1 : 1)) + meta.anchorX * meta.naturalWidth;
      const localY = ry / stem.scale + meta.anchorY * meta.naturalHeight;
      const normX = localX / meta.naturalWidth;
      const normY = localY / meta.naturalHeight;

      const mask = getSyncHitMask(stem.skuId);
      if (mask) {
        if (hitTestDecodedMask(mask, normX, normY, 3)) {
          matches.push(stem.id);
        }
      } else {
        const distHead = Math.hypot(
          localX - meta.anchorX * meta.naturalWidth,
          localY - meta.anchorY * meta.naturalHeight,
        );
        if (distHead <= meta.headRadiusWorld * 1.25) {
          matches.push(stem.id);
        }
      }
    }

    return matches;
  }

  private bindStageEvents(): void {
    this.stage.on("pointerdown", (e) => {
      if (e.target === this.stage) {
        this.onSelect([], []);
        return;
      }

      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;
      const scale = this.stage.scaleX() || 1;
      const worldX = pointer.x / scale;
      const worldY = pointer.y / scale;
      const overlapIds = this.findStemsAtWorldPoint(worldX, worldY);

      const nodeId = e.target.id();
      if (!nodeId) return;

      const additive = this.multiSelectActive || e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
      if (additive) {
        const next = this.selectedIds.includes(nodeId)
          ? this.selectedIds.filter((id) => id !== nodeId)
          : [...this.selectedIds, nodeId];
        this.onSelect(next, overlapIds);
        return;
      }

      // If user clicks already selected single stem while holding Alt/Option, cycle overlapping stem behind it
      if (
        e.evt.altKey &&
        this.selectedIds.length === 1 &&
        this.selectedIds[0] === nodeId &&
        overlapIds.length > 1
      ) {
        const curIdx = overlapIds.indexOf(nodeId);
        const nextId = overlapIds[(curIdx + 1) % overlapIds.length] ?? nodeId;
        this.onSelect([nextId], overlapIds);
        return;
      }

      this.onSelect([nodeId], overlapIds);
    });

    this.transformer.on("transform", () => {
      if (!this.currentScene) return;
      for (const proxy of this.transformer.nodes()) {
        const id = proxy.id();
        const stemNode = this.stemNodes.get(id);
        const origStem = this.currentScene.stems.find((s) => s.id === id);
        if (!stemNode || !origStem || origStem.locked) continue;
        const sc = clamp(Math.abs(proxy.scaleY()), 0.6, 1.5);
        stemNode.setAttrs({
          image: stemNode.image(),
          x: proxy.x(),
          y: proxy.y(),
          scaleX: sc * (origStem.flippedX ? -1 : 1),
          scaleY: sc,
          rotation: proxy.rotation(),
        });
      }
      this.backLayer.batchDraw();
      this.vesselFrontLayer.batchDraw();
    });

    this.transformer.on("transformend", () => {
      this.commitTransformerChanges();
    });
  }

  private commitTransformerChanges(): void {
    if (!this.currentScene) return;
    const updates: Array<{ id: string; x: number; y: number; scale: number; rotationDeg: number }> = [];

    for (const proxy of this.transformer.nodes()) {
      const id = proxy.id();
      const origStem = this.currentScene.stems.find((s) => s.id === id);
      const stemNode = this.stemNodes.get(id);
      if (!origStem || origStem.locked) continue;

      const flipSign = origStem.flippedX ? -1 : 1;
      const nextScale = clamp(Number(Math.abs(proxy.scaleY()).toFixed(2)), 0.6, 1.5);
      proxy.scaleX(nextScale);
      proxy.scaleY(nextScale);

      const nextX = clamp(Number(proxy.x().toFixed(1)), 120, 880);
      const nextY = clamp(Number(proxy.y().toFixed(1)), 100, 840);
      proxy.x(nextX);
      proxy.y(nextY);

      if (stemNode) {
        stemNode.setAttrs({
          image: stemNode.image(),
          x: nextX,
          y: nextY,
          scaleX: nextScale * flipSign,
          scaleY: nextScale,
          rotation: normalizeDeg(proxy.rotation()),
        });
      }

      updates.push({
        id,
        x: nextX,
        y: nextY,
        scale: nextScale,
        rotationDeg: normalizeDeg(proxy.rotation()),
      });
    }

    if (updates.length > 0) {
      this.onCommit(updates);
    }
  }

  private async loadImage(src: string): Promise<HTMLImageElement | null> {
    const cached = this.imageCache.get(src);
    if (cached) return cached;

    const existing = this.inFlightLoads.get(src);
    if (existing) return existing;

    const p = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });

    this.inFlightLoads.set(src, p);
    return p;
  }

  public syncScene(
    scene: BouquetSceneV1,
    metaMap: ReadonlyMap<string, BotanicalMeta>,
    selectedIds: string[],
  ): void {
    if (this.destroyed) return;
    this.currentScene = scene;
    this.metaMap = metaMap;
    this.selectedIds = selectedIds;

    const vesselRule = VESSEL_RULES[scene.presentation.vesselId];
    this.shadowEllipse.y(vesselRule.vesselId === "bare-stems" ? 965 : 1085);

    // Clip pocket polygon when stem visibility != exposed
    if (scene.presentation.stemVisibility !== "exposed" && vesselRule.vesselId !== "bare-stems") {
      const poly = getPocketClipPath(vesselRule.vesselId);
      this.stemClipGroup.clipFunc((ctx) => {
        ctx.beginPath();
        poly.forEach(([px, py], i) => {
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
      });
    } else {
      this.stemClipGroup.clipFunc(undefined);
    }

    // Load & bind vessel back / front
    if (vesselRule.vesselId === "bare-stems") {
      this.vesselBackImage.image(undefined);
      this.vesselFrontImage.image(undefined);
    } else {
      const backSrc = `/assets/v1/vessels/${vesselRule.vesselId}-back-studio.webp`;
      const frontSrc = `/assets/v1/vessels/${vesselRule.vesselId}-front-studio.webp`;
      void this.loadImage(backSrc).then((img) => {
        if (!this.destroyed && img) {
          this.vesselBackImage.image(img);
          this.backLayer.batchDraw();
        }
      });
      void this.loadImage(frontSrc).then((img) => {
        if (!this.destroyed && img) {
          this.vesselFrontImage.image(img);
          this.vesselFrontLayer.batchDraw();
        }
      });
    }

    // Load & bind collar bow
    const bowSrc = resolveBowAssetPath(scene.presentation, "studio");
    if (bowSrc) {
      this.bowImage.y(vesselRule.collarY - 154);
      this.bowImage.visible(true);
      void this.loadImage(bowSrc).then((img) => {
        if (!this.destroyed && img) {
          this.bowImage.image(img);
          this.vesselFrontLayer.batchDraw();
        }
      });
    } else {
      this.bowImage.image(undefined);
      this.bowImage.visible(false);
    }

    // Reconcile stem nodes deterministically by zIndex
    const sorted = [...scene.stems].sort((a, b) => a.zIndex - b.zIndex);
    const keepIds = new Set(sorted.map((s) => s.id));
    for (const [id, node] of this.stemNodes.entries()) {
      if (!keepIds.has(id)) {
        node.destroy();
        this.stemNodes.delete(id);
      }
    }

    this.stemClipGroup.removeChildren();
    this.frontDrapeGroup.removeChildren();

    sorted.forEach((stem) => {
      const meta = metaMap.get(stem.skuId);
      if (!meta) return;

      void preloadHitMask(stem.skuId, meta.hitmaskPath);

      let node = this.stemNodes.get(stem.id);
      if (!node) {
        node = new Konva.Image({
          id: stem.id,
          image: undefined,
          hitFunc: (context, shape) => {
            context.beginPath();
            const ax = meta.anchorX * meta.naturalWidth;
            const ay = meta.anchorY * meta.naturalHeight;
            context.arc(ax, ay, Math.max(40, meta.headRadiusWorld * 1.18), 0, Math.PI * 2);
            if (meta.role !== "petal") {
              context.rect(ax - 22, ay, 44, meta.naturalHeight - ay);
            }
            context.closePath();
            context.fillStrokeShape(shape);
          },
        });
        this.bindStemDragEvents(node);
        this.stemNodes.set(stem.id, node);
      }

      const flipSign = stem.flippedX ? -1 : 1;
      node.setAttrs({
        image: node.image(),
        x: stem.x,
        y: stem.y,
        width: meta.naturalWidth,
        height: meta.naturalHeight,
        offsetX: meta.anchorX * meta.naturalWidth,
        offsetY: meta.anchorY * meta.naturalHeight,
        scaleX: stem.scale * flipSign,
        scaleY: stem.scale,
        rotation: stem.rotationDeg,
        draggable: !stem.locked,
        shadowColor: "rgba(31, 30, 26, 0.14)",
        shadowBlur: 14,
        shadowOffsetX: 3,
        shadowOffsetY: 7,
      });

      const isFrontDrape = isFrontDrapeStem(stem, meta, sorted.length);
      if (isFrontDrape) {
        this.frontDrapeGroup.add(node);
      } else {
        this.stemClipGroup.add(node);
      }

      void this.loadImage(meta.studioPath).then((img) => {
        if (!this.destroyed && img && node) {
          node.image(img);
          this.backLayer.batchDraw();
          this.vesselFrontLayer.batchDraw();
        }
      });
    });

    this.syncSelectionVisuals(sorted, selectedIds, metaMap);

    this.backLayer.batchDraw();
    this.vesselFrontLayer.batchDraw();
    this.selectionLayer.batchDraw();
  }

  private bindStemDragEvents(node: Konva.Image): void {
    let startPositions = new Map<string, { x: number; y: number }>();

    node.on("dragstart", () => {
      if (!this.currentScene) return;
      const draggedId = node.id();
      const targetIds = this.selectedIds.includes(draggedId) ? this.selectedIds : [draggedId];
      startPositions = new Map();

      for (const id of targetIds) {
        const s = this.currentScene.stems.find((item) => item.id === id);
        const sNode = this.stemNodes.get(id);
        if (s && sNode && !s.locked) {
          startPositions.set(id, { x: sNode.x(), y: sNode.y() });
          sNode.moveTo(this.activeDragLayer);
        }
      }
      this.activeDragLayer.batchDraw();
      this.backLayer.batchDraw();
      this.vesselFrontLayer.batchDraw();
    });

    node.on("dragmove", () => {
      const origin = startPositions.get(node.id());
      if (!origin) return;
      const dx = node.x() - origin.x;
      const dy = node.y() - origin.y;

      for (const [id, initPos] of startPositions.entries()) {
        if (id === node.id()) continue;
        const peer = this.stemNodes.get(id);
        if (peer) {
          peer.x(clamp(initPos.x + dx, 120, 880));
          peer.y(clamp(initPos.y + dy, 100, 840));
        }
      }
      for (const id of startPositions.keys()) {
        const peer = this.stemNodes.get(id);
        const proxy = this.bloomProxies.get(id);
        if (peer && proxy) {
          proxy.x(peer.x());
          proxy.y(peer.y());
        }
      }
      this.activeDragLayer.batchDraw();
      this.selectionLayer.batchDraw();
    });

    node.on("dragend", () => {
      if (!this.currentScene) return;
      const updates: Array<{ id: string; x: number; y: number; scale: number; rotationDeg: number }> = [];

      for (const id of startPositions.keys()) {
        const peer = this.stemNodes.get(id);
        const stem = this.currentScene.stems.find((item) => item.id === id);
        if (!peer || !stem) continue;
        const cx = clamp(Number(peer.x().toFixed(1)), 120, 880);
        const cy = clamp(Number(peer.y().toFixed(1)), 100, 840);
        peer.x(cx);
        peer.y(cy);

        updates.push({
          id,
          x: cx,
          y: cy,
          scale: stem.scale,
          rotationDeg: stem.rotationDeg,
        });
      }

      if (updates.length > 0) {
        this.onCommit(updates);
      }
    });
  }

  private syncSelectionVisuals(
    sortedStems: StemInstance[],
    selectedIds: string[],
    metaMap: ReadonlyMap<string, BotanicalMeta>,
  ): void {
    const proxyNodes: Konva.Rect[] = [];
    this.proxiesGroup.removeChildren();
    this.bloomProxies.clear();
    this.lockBadgesGroup.removeChildren();

    let anyLocked = false;

    for (const id of selectedIds) {
      const stem = sortedStems.find((s) => s.id === id);
      const meta = stem ? metaMap.get(stem.skuId) : undefined;
      if (!stem) continue;

      const baseR = (meta?.headRadiusWorld ?? 60) * 1.15;
      if (stem.locked) {
        anyLocked = true;
        const rScaled = baseR * stem.scale;
        this.lockBadgesGroup.add(
          new Konva.Circle({
            x: stem.x,
            y: stem.y,
            radius: rScaled,
            stroke: "#35513D",
            strokeWidth: 1.5,
            dash: [5, 4],
          }),
        );
        const badge = new Konva.Label({
          x: stem.x,
          y: Math.max(40, stem.y - rScaled - 18),
        });
        badge.add(new Konva.Tag({ fill: "#1F1E1A", cornerRadius: 999 }));
        badge.add(
          new Konva.Text({
            text: "Locked",
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
            padding: 6,
            fill: "#FAF8F5",
          }),
        );
        this.lockBadgesGroup.add(badge);
        continue;
      }

      const side = baseR * 2;
      const proxy = new Konva.Rect({
        id: stem.id,
        x: stem.x,
        y: stem.y,
        width: side,
        height: side,
        offsetX: baseR,
        offsetY: baseR,
        scaleX: stem.scale,
        scaleY: stem.scale,
        rotation: stem.rotationDeg,
        opacity: 0,
        listening: false,
      });
      this.proxiesGroup.add(proxy);
      this.bloomProxies.set(stem.id, proxy);
      proxyNodes.push(proxy);
    }

    this.transformer.nodes(anyLocked ? [] : proxyNodes);
    this.transformer.resizeEnabled(!anyLocked && proxyNodes.length > 0);
    this.transformer.rotateEnabled(!anyLocked && proxyNodes.length > 0);
  }

  public destroy(): void {
    this.destroyed = true;
    this.resizeObserver.disconnect();
    this.stage.destroy();
  }
}
