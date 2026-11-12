"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  BowStyleId,
  BouquetSceneV1,
  CardConfig,
  CompositionPresetId,
  MAX_STEMS_GLOBAL,
  OccasionSlug,
  PhotoAttachmentRef,
  RibbonColorId,
  RibbonFinishId,
  StemInstance,
  StemVisibility,
  TableSurfaceId,
  UI_COPY,
  VESSEL_RULES,
  VesselId,
  VoiceMessageRef,
} from "@/engine/types";
import { arrangeBouquetByPreset, insertStemIntoOpenSlot } from "@/engine/arranger";
import { STARTER_BOUQUETS, buildSceneFromPreset } from "@/engine/presets";
import { OCCASION_TEMPLATES, applyOccasionTemplateToScene } from "@/engine/occasions";
import { normalizePresentationConfig, validateAndNormalizeScene } from "@/engine/validation";
import { ALLOWED_SKU_IDS, CATALOG_META_MAP } from "@/generated/catalog-manifest";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "@/lib/draft-storage";
import { CARD_TEMPLATE_META } from "@/lib/card-styles";
import {
  SavedProjectFull,
  SavedProjectSummary,
  workspaceHeaders,
} from "@/lib/workspace-client";
import { trackPrivacySafeEvent } from "@/lib/analytics";

const MAX_UNDO_HISTORY = 30;

type NoticeState = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
} | null;

type ShareState = {
  slug: string;
  editToken: string;
  shareUrl: string;
  ogImageUrl: string;
  isStale: boolean;
} | null;

type StudioContextValue = {
  scene: BouquetSceneV1;
  selectedIds: string[];
  overlapCandidates: string[];
  multiSelectMode: boolean;
  activePresetId: string;
  canUndo: boolean;
  canRedo: boolean;
  notice: NoticeState;
  shareState: ShareState;
  isPublishing: boolean;
  publishError: string | null;
  draftSavedAt: number | null;
  currentProjectId: string | null;
  currentProjectTitle: string | null;
  savedProjects: SavedProjectSummary[];
  projectsLoading: boolean;
  projectSaving: boolean;
  setSelectedIds: (ids: string[], overlaps?: string[]) => void;
  toggleMultiSelectMode: () => void;
  cycleOverlappingStem: () => void;
  undo: () => void;
  redo: () => void;
  clearNotice: () => void;
  clearPublishError: () => void;
  addStem: (skuId: string) => void;
  removeOneBySku: (skuId: string) => void;
  removeStems: (ids?: string[]) => void;
  replaceStemSku: (stemId: string, newSkuId: string) => void;
  duplicateStems: (ids?: string[]) => void;
  bringForward: (ids?: string[]) => void;
  sendBackward: (ids?: string[]) => void;
  toggleLockStems: (ids?: string[]) => void;
  flipStemsHorizontal: (ids?: string[]) => void;
  swapStemVariation: (stemId: string, newSkuId: string) => void;
  updateStemsTransform: (
    updates: Array<{ id: string; x: number; y: number; scale: number; rotationDeg: number }>,
  ) => void;
  applyCompositionPreset: (preset: CompositionPresetId) => void;
  loadStarterPreset: (starterId: string) => void;
  resetArrangement: () => void;
  startNewBouquet: () => void;
  setVessel: (vesselId: VesselId) => void;
  setBowStyle: (bowStyleId: BowStyleId) => void;
  setRibbonFinish: (ribbonFinishId: RibbonFinishId) => void;
  setRibbonColor: (ribbonColorId: RibbonColorId) => void;
  setStemVisibility: (stemVisibility: StemVisibility) => void;
  setTableSurface: (surfaceId: TableSurfaceId) => void;
  applyOccasionTemplate: (occasion: OccasionSlug, mode: "full" | "style-only") => void;
  updateCard: (patch: Partial<CardConfig>) => void;
  addPhotoAttachment: (photo: PhotoAttachmentRef) => void;
  updatePhotoCaption: (id: string, caption: string) => void;
  removePhotoAttachment: (id: string) => void;
  setVoiceMessage: (voice: VoiceMessageRef | null) => void;
  setShowColophon: (show: boolean) => void;
  setHideNamesInPreview: (hide: boolean) => void;
  setIsPublicShowcase: (isPublic: boolean) => void;
  publishShareLink: () => Promise<ShareState | null>;
  refreshSavedProjects: () => Promise<void>;
  saveProjectToServer: (
    explicitTitle?: string,
    options?: { saveAsNew?: boolean },
  ) => Promise<SavedProjectSummary | null>;
  openSavedProject: (projectId: string) => Promise<boolean>;
  duplicateSavedProject: (projectId: string) => Promise<SavedProjectSummary | null>;
  deleteSavedProject: (projectId: string) => Promise<boolean>;
  applyFullScene: (nextScene: BouquetSceneV1, noticeText?: string) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function reindexStems(stems: readonly StemInstance[]): StemInstance[] {
  return stems.map((s, idx) => ({ ...s, zIndex: idx }));
}

function getDefaultInitialScene(
  presetQuery?: string | null,
  occasionQuery?: string | null,
  stemQuery?: string | null,
): { scene: BouquetSceneV1; presetId: string } {
  const starter =
    (presetQuery ? STARTER_BOUQUETS.find((p) => p.id === presetQuery) : undefined) ?? STARTER_BOUQUETS[0]!;
  let baseScene = buildSceneFromPreset(starter, CATALOG_META_MAP);
  if (occasionQuery && occasionQuery in OCCASION_TEMPLATES) {
    baseScene = applyOccasionTemplateToScene(baseScene, occasionQuery as OccasionSlug, "full", CATALOG_META_MAP);
  }
  if (stemQuery && CATALOG_META_MAP.has(stemQuery) && baseScene.stems.length < MAX_STEMS_GLOBAL) {
    const inserted = insertStemIntoOpenSlot(
      baseScene.stems,
      stemQuery,
      `stem-prefill-${stemQuery}`,
      baseScene.presentation.compositionPreset,
      CATALOG_META_MAP,
    );
    baseScene = {
      ...baseScene,
      stems: reindexStems([...baseScene.stems, inserted]),
    };
  }
  return {
    scene: baseScene,
    presetId: starter.id,
  };
}

export function StudioSceneProvider({
  children,
  initialPresetSlug,
  initialOccasionSlug,
  initialStemSlug,
}: {
  children: React.ReactNode;
  initialPresetSlug?: string | null;
  initialOccasionSlug?: string | null;
  initialStemSlug?: string | null;
}) {
  const initialData = useMemo(
    () => getDefaultInitialScene(initialPresetSlug, initialOccasionSlug, initialStemSlug),
    [initialOccasionSlug, initialPresetSlug, initialStemSlug],
  );

  const [scene, setScene] = useState<BouquetSceneV1>(initialData.scene);
  const [activePresetId, setActivePresetId] = useState<string>(initialData.presetId);
  const [selectedIds, setSelectedIdsState] = useState<string[]>([]);
  const [overlapCandidates, setOverlapCandidates] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [shareState, setShareState] = useState<ShareState>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);

  const undoStackRef = useRef<BouquetSceneV1[]>([]);
  const redoStackRef = useRef<BouquetSceneV1[]>([]);
  const [historyTick, setHistoryTick] = useState(0);
  const uidCounterRef = useRef(1);

  // Hydrate draft from localStorage ONLY if user didn't explicitly navigate with ?preset= or ?occasion=
  useEffect(() => {
    if (initialPresetSlug || initialOccasionSlug) return;
    const saved = loadLocalDraft(ALLOWED_SKU_IDS);
    if (saved) {
      setScene(saved);
    }
  }, [initialOccasionSlug, initialPresetSlug]);

  // Persist local draft quietly on scene changes
  useEffect(() => {
    if (saveLocalDraft(scene)) {
      setDraftSavedAt(Date.now());
    }
  }, [scene]);

  const commitSceneChange = useCallback(
    (updater: (prev: BouquetSceneV1) => BouquetSceneV1) => {
      setScene((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        undoStackRef.current = [...undoStackRef.current.slice(-(MAX_UNDO_HISTORY - 1)), prev];
        redoStackRef.current = [];
        setHistoryTick((t) => t + 1);
        return next;
      });
      setShareState((prev) => (prev ? { ...prev, isStale: true } : prev));
    },
    [],
  );

  const setSelectedIds = useCallback((ids: string[], overlaps: string[] = []) => {
    setSelectedIdsState(ids);
    setOverlapCandidates(overlaps);
  }, []);

  const toggleMultiSelectMode = useCallback(() => {
    setMultiSelectMode((prev) => !prev);
  }, []);

  const cycleOverlappingStem = useCallback(() => {
    if (overlapCandidates.length < 2) return;
    const current = selectedIds[0];
    const idx = current ? overlapCandidates.indexOf(current) : -1;
    const nextId = overlapCandidates[(idx + 1) % overlapCandidates.length];
    if (nextId) {
      setSelectedIdsState([nextId]);
    }
  }, [overlapCandidates, selectedIds]);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const prevSnapshot = stack[stack.length - 1]!;
    undoStackRef.current = stack.slice(0, -1);
    setScene((current) => {
      redoStackRef.current = [...redoStackRef.current.slice(-(MAX_UNDO_HISTORY - 1)), current];
      return prevSnapshot;
    });
    setHistoryTick((t) => t + 1);
    setShareState((prev) => (prev ? { ...prev, isStale: true } : prev));
  }, []);

  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const nextSnapshot = stack[stack.length - 1]!;
    redoStackRef.current = stack.slice(0, -1);
    setScene((current) => {
      undoStackRef.current = [...undoStackRef.current.slice(-(MAX_UNDO_HISTORY - 1)), current];
      return nextSnapshot;
    });
    setHistoryTick((t) => t + 1);
    setShareState((prev) => (prev ? { ...prev, isStale: true } : prev));
  }, []);

  const addStem = useCallback(
    (skuId: string) => {
      if (!CATALOG_META_MAP.has(skuId)) return;
      if (scene.stems.length >= MAX_STEMS_GLOBAL) {
        setNotice({ tone: "warning", text: UI_COPY.maxStemsReached });
        return;
      }

      uidCounterRef.current += 1;
      const newId = `stem-custom-${Date.now()}-${uidCounterRef.current}`;
      const inserted = insertStemIntoOpenSlot(
        scene.stems,
        skuId,
        newId,
        scene.presentation.compositionPreset,
        CATALOG_META_MAP,
      );

      commitSceneChange((prev) => ({
        ...prev,
        stems: reindexStems([...prev.stems, inserted]),
      }));
      setSelectedIdsState([newId]);
      setNotice({
        tone: "success",
        text: `Added ${CATALOG_META_MAP.get(skuId)?.name ?? "stem"} (${scene.stems.length + 1}/${MAX_STEMS_GLOBAL}).`,
      });
    },
    [commitSceneChange, scene.presentation.compositionPreset, scene.stems],
  );

  const removeOneBySku = useCallback(
    (skuId: string) => {
      const matching = scene.stems
        .filter((s) => s.skuId === skuId)
        .sort((a, b) => b.zIndex - a.zIndex);
      if (matching.length === 0) return;
      const target = matching[0]!;
      commitSceneChange((prev) => ({
        ...prev,
        stems: reindexStems(prev.stems.filter((s) => s.id !== target.id)),
      }));
      setSelectedIdsState((prev) => prev.filter((id) => id !== target.id));
      setNotice({
        tone: "info",
        text: `Removed 1 ${CATALOG_META_MAP.get(skuId)?.name ?? "stem"} (${Math.max(0, scene.stems.length - 1)}/${MAX_STEMS_GLOBAL}).`,
      });
    },
    [commitSceneChange, scene.stems],
  );

  const removeStems = useCallback(
    (ids?: string[]) => {
      const targetSet = new Set(ids && ids.length > 0 ? ids : selectedIds);
      if (targetSet.size === 0) return;
      commitSceneChange((prev) => ({
        ...prev,
        stems: reindexStems(prev.stems.filter((s) => !targetSet.has(s.id))),
      }));
      setSelectedIdsState([]);
      setOverlapCandidates([]);
    },
    [commitSceneChange, selectedIds],
  );

  const replaceStemSku = useCallback(
    (stemId: string, newSkuId: string) => {
      if (!CATALOG_META_MAP.has(newSkuId)) return;
      commitSceneChange((prev) => ({
        ...prev,
        stems: prev.stems.map((s) => (s.id === stemId ? { ...s, skuId: newSkuId } : s)),
      }));
      setNotice({
        tone: "success",
        text: `Replaced stem with ${CATALOG_META_MAP.get(newSkuId)?.name ?? newSkuId}.`,
      });
    },
    [commitSceneChange],
  );

  const duplicateStems = useCallback(
    (ids?: string[]) => {
      const targetSet = new Set(ids && ids.length > 0 ? ids : selectedIds);
      const targets = scene.stems.filter((s) => targetSet.has(s.id));
      if (targets.length === 0) return;
      if (scene.stems.length + targets.length > MAX_STEMS_GLOBAL) {
        setNotice({ tone: "warning", text: UI_COPY.maxStemsReached });
        return;
      }

      const copies: StemInstance[] = targets.map((orig, idx) => {
        uidCounterRef.current += 1;
        return {
          ...orig,
          id: `stem-dup-${Date.now()}-${uidCounterRef.current + idx}`,
          x: Math.min(860, orig.x + 28),
          y: Math.max(115, orig.y - 18),
          rotationDeg: Math.max(-180, Math.min(180, orig.rotationDeg + 6)),
          locked: false,
        };
      });

      commitSceneChange((prev) => ({
        ...prev,
        stems: reindexStems([...prev.stems, ...copies]),
      }));
      setSelectedIdsState(copies.map((c) => c.id));
    },
    [commitSceneChange, scene.stems, selectedIds],
  );

  const bringForward = useCallback(
    (ids?: string[]) => {
      const targetSet = new Set(ids && ids.length > 0 ? ids : selectedIds);
      if (targetSet.size === 0) return;
      commitSceneChange((prev) => {
        const sorted = [...prev.stems].sort((a, b) => a.zIndex - b.zIndex);
        for (let i = sorted.length - 2; i >= 0; i -= 1) {
          const cur = sorted[i]!;
          const above = sorted[i + 1]!;
          if (targetSet.has(cur.id) && !targetSet.has(above.id)) {
            sorted[i] = above;
            sorted[i + 1] = cur;
          }
        }
        return { ...prev, stems: reindexStems(sorted) };
      });
    },
    [commitSceneChange, selectedIds],
  );

  const sendBackward = useCallback(
    (ids?: string[]) => {
      const targetSet = new Set(ids && ids.length > 0 ? ids : selectedIds);
      if (targetSet.size === 0) return;
      commitSceneChange((prev) => {
        const sorted = [...prev.stems].sort((a, b) => a.zIndex - b.zIndex);
        for (let i = 1; i < sorted.length; i += 1) {
          const cur = sorted[i]!;
          const below = sorted[i - 1]!;
          if (targetSet.has(cur.id) && !targetSet.has(below.id)) {
            sorted[i] = below;
            sorted[i - 1] = cur;
          }
        }
        return { ...prev, stems: reindexStems(sorted) };
      });
    },
    [commitSceneChange, selectedIds],
  );

  const toggleLockStems = useCallback(
    (ids?: string[]) => {
      const targetSet = new Set(ids && ids.length > 0 ? ids : selectedIds);
      if (targetSet.size === 0) return;
      commitSceneChange((prev) => {
        const targets = prev.stems.filter((s) => targetSet.has(s.id));
        const shouldLock = targets.some((t) => !t.locked);
        return {
          ...prev,
          stems: prev.stems.map((s) => (targetSet.has(s.id) ? { ...s, locked: shouldLock } : s)),
        };
      });
    },
    [commitSceneChange, selectedIds],
  );

  const flipStemsHorizontal = useCallback(
    (ids?: string[]) => {
      const targetSet = new Set(ids && ids.length > 0 ? ids : selectedIds);
      if (targetSet.size === 0) return;
      commitSceneChange((prev) => ({
        ...prev,
        stems: prev.stems.map((s) =>
          targetSet.has(s.id) && !s.locked ? { ...s, flippedX: !s.flippedX } : s,
        ),
      }));
    },
    [commitSceneChange, selectedIds],
  );

  const swapStemVariation = useCallback(
    (stemId: string, newSkuId: string) => {
      if (!CATALOG_META_MAP.has(newSkuId)) return;
      commitSceneChange((prev) => ({
        ...prev,
        stems: prev.stems.map((s) => (s.id === stemId ? { ...s, skuId: newSkuId } : s)),
      }));
    },
    [commitSceneChange],
  );

  const updateStemsTransform = useCallback(
    (updates: Array<{ id: string; x: number; y: number; scale: number; rotationDeg: number }>) => {
      if (updates.length === 0) return;
      const map = new Map(updates.map((u) => [u.id, u]));
      commitSceneChange((prev) => ({
        ...prev,
        stems: prev.stems.map((s) => {
          const patch = map.get(s.id);
          if (!patch || s.locked) return s;
          return {
            ...s,
            x: patch.x,
            y: patch.y,
            scale: patch.scale,
            rotationDeg: patch.rotationDeg,
          };
        }),
      }));
    },
    [commitSceneChange],
  );

  const applyCompositionPreset = useCallback(
    (preset: CompositionPresetId) => {
      commitSceneChange((prev) => ({
        ...prev,
        stems: arrangeBouquetByPreset(prev.stems, preset, CATALOG_META_MAP),
        presentation: {
          ...prev.presentation,
          compositionPreset: preset,
        },
      }));
      if (preset === "minimalist") {
        setNotice({ tone: "info", text: UI_COPY.minimalistTip });
      }
    },
    [commitSceneChange],
  );

  const loadStarterPreset = useCallback(
    (starterId: string) => {
      const starter = STARTER_BOUQUETS.find((p) => p.id === starterId);
      if (!starter) return;
      setActivePresetId(starter.id);
      commitSceneChange(() => buildSceneFromPreset(starter, CATALOG_META_MAP));
      setSelectedIdsState([]);
    },
    [commitSceneChange],
  );

  const resetArrangement = useCallback(() => {
    const starter = STARTER_BOUQUETS.find((p) => p.id === activePresetId) ?? STARTER_BOUQUETS[0]!;
    commitSceneChange((prev) => ({
      ...prev,
      stems: arrangeBouquetByPreset(prev.stems.map((s) => ({ ...s, locked: false })), starter.compositionPreset, CATALOG_META_MAP),
      presentation: {
        ...prev.presentation,
        compositionPreset: starter.compositionPreset,
      },
    }));
    setNotice({ tone: "info", text: "Stems rearranged naturally with locked pins cleared." });
  }, [activePresetId, commitSceneChange]);

  const startNewBouquet = useCallback(() => {
    clearLocalDraft();
    const fresh = getDefaultInitialScene(null);
    setActivePresetId(fresh.presetId);
    setCurrentProjectId(null);
    setCurrentProjectTitle(null);
    commitSceneChange(() => fresh.scene);
    setSelectedIdsState([]);
    setOverlapCandidates([]);
    setShareState(null);
    setPublishError(null);
    setNotice({
      tone: "info",
      text: "Started a fresh bouquet arrangement. (Use Undo if you need the previous arrangement back.)",
    });
  }, [commitSceneChange]);

  const setVessel = useCallback(
    (vesselId: VesselId) => {
      commitSceneChange((prev) => {
        const prevRule = VESSEL_RULES[prev.presentation.vesselId];
        const nextRule = VESSEL_RULES[vesselId];
        const restoredBow =
          !prevRule.supportsBow && nextRule.supportsBow && prev.presentation.bowStyleId === "none"
            ? "double-bow"
            : prev.presentation.bowStyleId;

        return {
          ...prev,
          presentation: normalizePresentationConfig({
            ...prev.presentation,
            vesselId,
            bowStyleId: restoredBow,
          }),
        };
      });
    },
    [commitSceneChange],
  );

  const setBowStyle = useCallback(
    (bowStyleId: BowStyleId) => {
      commitSceneChange((prev) => ({
        ...prev,
        presentation: normalizePresentationConfig({
          ...prev.presentation,
          bowStyleId,
        }),
      }));
    },
    [commitSceneChange],
  );

  const setRibbonFinish = useCallback(
    (ribbonFinishId: RibbonFinishId) => {
      commitSceneChange((prev) => ({
        ...prev,
        presentation: normalizePresentationConfig({
          ...prev.presentation,
          ribbonFinishId,
          bowStyleId: prev.presentation.bowStyleId === "none" ? "double-bow" : prev.presentation.bowStyleId,
        }),
      }));
    },
    [commitSceneChange],
  );

  const setRibbonColor = useCallback(
    (ribbonColorId: RibbonColorId) => {
      commitSceneChange((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          ribbonColorId,
        },
      }));
    },
    [commitSceneChange],
  );

  const applyOccasionTemplate = useCallback(
    (occasion: OccasionSlug, mode: "full" | "style-only") => {
      commitSceneChange((prev) =>
        applyOccasionTemplateToScene(prev, occasion, mode, CATALOG_META_MAP),
      );
      if (mode === "full") {
        setSelectedIdsState([]);
      }
      const label = OCCASION_TEMPLATES[occasion].label;
      setNotice({
        tone: "success",
        text:
          mode === "full"
            ? `Applied full ${label} template (blooms, wrapping & card style).`
            : `Applied ${label} wrapping, ribbon & card styling to your current blooms.`,
      });
    },
    [commitSceneChange],
  );

  const setStemVisibility = useCallback(
    (stemVisibility: StemVisibility) => {
      commitSceneChange((prev) => ({
        ...prev,
        presentation: normalizePresentationConfig({
          ...prev.presentation,
          stemVisibility,
        }),
      }));
    },
    [commitSceneChange],
  );

  const setTableSurface = useCallback(
    (tableSurfaceId: TableSurfaceId) => {
      commitSceneChange((prev) => ({
        ...prev,
        presentation: {
          ...prev.presentation,
          tableSurfaceId,
        },
      }));
    },
    [commitSceneChange],
  );

  const updateCard = useCallback(
    (patch: Partial<CardConfig>) => {
      commitSceneChange((prev) => {
        const nextTemplate = patch.templateId ?? prev.card.templateId;
        const tplMeta = CARD_TEMPLATE_META[nextTemplate];
        const nextPaper =
          patch.paperTintId ??
          (patch.templateId ? tplMeta.defaultPaperTint : prev.card.paperTintId);
        const nextTextColor =
          patch.textColorId ??
          (patch.templateId ? tplMeta.defaultTextColor : prev.card.textColorId);

        return {
          ...prev,
          card: {
            ...prev.card,
            ...patch,
            templateId: nextTemplate,
            paperTintId: nextPaper,
            textColorId: nextTextColor,
          },
        };
      });
    },
    [commitSceneChange],
  );

  const setShowColophon = useCallback(
    (showColophon: boolean) => {
      commitSceneChange((prev) => ({ ...prev, showColophon }));
    },
    [commitSceneChange],
  );

  const setHideNamesInPreview = useCallback(
    (hideNamesInPreview: boolean) => {
      commitSceneChange((prev) => ({
        ...prev,
        hideNamesInPreview,
        isPublicShowcase: hideNamesInPreview ? false : prev.isPublicShowcase,
      }));
    },
    [commitSceneChange],
  );

  const setIsPublicShowcase = useCallback(
    (isPublicShowcase: boolean) => {
      commitSceneChange((prev) => ({
        ...prev,
        isPublicShowcase: prev.hideNamesInPreview ? false : isPublicShowcase,
      }));
    },
    [commitSceneChange],
  );

  const addPhotoAttachment = useCallback(
    (photo: PhotoAttachmentRef) => {
      commitSceneChange((prev) => {
        const current = prev.photos ?? [];
        if (current.length >= 6) return prev;
        return { ...prev, photos: [...current, photo] };
      });
      setNotice({ tone: "success", text: "Attached cropped photo to keepsake gallery." });
    },
    [commitSceneChange],
  );

  const updatePhotoCaption = useCallback(
    (id: string, caption: string) => {
      commitSceneChange((prev) => ({
        ...prev,
        photos: (prev.photos ?? []).map((p) => (p.id === id ? { ...p, caption } : p)),
      }));
    },
    [commitSceneChange],
  );

  const removePhotoAttachment = useCallback(
    (id: string) => {
      commitSceneChange((prev) => ({
        ...prev,
        photos: (prev.photos ?? []).filter((p) => p.id !== id),
      }));
    },
    [commitSceneChange],
  );

  const setVoiceMessage = useCallback(
    (voiceMessage: VoiceMessageRef | null) => {
      commitSceneChange((prev) => ({ ...prev, voiceMessage }));
      setNotice({
        tone: "info",
        text: voiceMessage ? "Attached personal voice note to bouquet." : "Removed voice note.",
      });
    },
    [commitSceneChange],
  );

  const publishShareLink = useCallback(async (): Promise<ShareState | null> => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch("/api/bouquets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scene.card.recipientName ? `For ${scene.card.recipientName}` : undefined,
          scene,
        }),
      });
      const json = (await res.json()) as {
        slug?: string;
        editToken?: string;
        shareUrl?: string;
        ogImageUrl?: string;
        error?: string;
      };
      if (!res.ok || !json.slug || !json.shareUrl) {
        const msg = json.error ?? "Unable to create share link.";
        setPublishError(msg);
        setNotice({ tone: "error", text: msg });
        return null;
      }
      const nextShare: ShareState = {
        slug: json.slug,
        editToken: json.editToken ?? "",
        shareUrl: json.shareUrl,
        ogImageUrl: json.ogImageUrl ?? `/api/og/${json.slug}`,
        isStale: false,
      };
      setShareState(nextShare);
      setNotice({ tone: "success", text: `Share link ready: ${json.shareUrl}` });
      trackPrivacySafeEvent("bouquet_published");
      return nextShare;
    } catch {
      const msg = "Network error while saving bouquet. Please check connection and retry.";
      setPublishError(msg);
      setNotice({ tone: "error", text: msg });
      return null;
    } finally {
      setIsPublishing(false);
    }
  }, [scene]);

  const refreshSavedProjects = useCallback(async () => {
    const headers = workspaceHeaders();
    if (!headers["x-workspace-token"]) return;
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects", { headers });
      if (!res.ok) return;
      const json = (await res.json()) as { projects?: SavedProjectSummary[] };
      if (Array.isArray(json.projects)) {
        setSavedProjects(json.projects);
      }
    } catch {
      // Non-fatal offline state
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSavedProjects();
  }, [refreshSavedProjects]);

  const saveProjectToServer = useCallback(
    async (
      explicitTitle?: string,
      options?: { saveAsNew?: boolean },
    ): Promise<SavedProjectSummary | null> => {
      const headers = workspaceHeaders();
      if (!headers["x-workspace-token"]) return null;
      setProjectSaving(true);
      try {
        const shouldCreate = Boolean(options?.saveAsNew || !currentProjectId);
        const endpoint = shouldCreate ? "/api/projects" : `/api/projects/${currentProjectId}`;
        const method = shouldCreate ? "POST" : "PATCH";
        const res = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            title: explicitTitle?.trim() || currentProjectTitle || undefined,
            scene,
            publishedSlug: shouldCreate ? null : shareState?.slug,
          }),
        });
        const json = (await res.json()) as {
          project?: SavedProjectFull;
          error?: string;
        };
        if (!res.ok || !json.project) {
          setNotice({ tone: "error", text: json.error ?? "Unable to save bouquet draft." });
          return null;
        }
        const savedSummary: SavedProjectSummary = {
          id: json.project.id,
          title: json.project.title,
          occasionTag: json.project.occasionTag,
          stemCount: json.project.stemCount,
          publishedSlug: json.project.publishedSlug,
          createdAt: json.project.createdAt,
          updatedAt: json.project.updatedAt,
        };
        setCurrentProjectId(savedSummary.id);
        setCurrentProjectTitle(savedSummary.title);
        setSavedProjects((prev) => [savedSummary, ...prev.filter((p) => p.id !== savedSummary.id)]);
        setNotice({ tone: "success", text: `Saved "${savedSummary.title}" to My Bouquets.` });
        return savedSummary;
      } catch {
        setNotice({ tone: "error", text: "Network error while saving bouquet draft." });
        return null;
      } finally {
        setProjectSaving(false);
      }
    },
    [currentProjectId, currentProjectTitle, scene, shareState?.slug],
  );

  const openSavedProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      const headers = workspaceHeaders();
      try {
        const res = await fetch(`/api/projects/${projectId}`, { headers });
        const json = (await res.json()) as {
          project?: SavedProjectFull;
          error?: string;
        };
        if (!res.ok || !json.project) {
          setNotice({ tone: "error", text: json.error ?? "Could not reopen saved bouquet." });
          return false;
        }
        const validated = validateAndNormalizeScene(json.project.scene, ALLOWED_SKU_IDS);
        if (!validated.ok) {
          setNotice({ tone: "error", text: validated.error });
          return false;
        }
        setCurrentProjectId(json.project.id);
        setCurrentProjectTitle(json.project.title);
        commitSceneChange(() => validated.scene);
        setSelectedIdsState([]);
        setOverlapCandidates([]);
        setShareState(null);
        setPublishError(null);
        setNotice({ tone: "success", text: `Reopened "${json.project.title}".` });
        return true;
      } catch {
        setNotice({ tone: "error", text: "Network error while opening saved bouquet." });
        return false;
      }
    },
    [commitSceneChange],
  );

  const duplicateSavedProject = useCallback(
    async (projectId: string): Promise<SavedProjectSummary | null> => {
      const headers = workspaceHeaders();
      try {
        const res = await fetch(`/api/projects/${projectId}/duplicate`, {
          method: "POST",
          headers,
        });
        const json = (await res.json()) as {
          project?: SavedProjectFull;
          error?: string;
        };
        if (!res.ok || !json.project) {
          setNotice({ tone: "error", text: json.error ?? "Unable to duplicate bouquet." });
          return null;
        }
        const copySummary: SavedProjectSummary = {
          id: json.project.id,
          title: json.project.title,
          occasionTag: json.project.occasionTag,
          stemCount: json.project.stemCount,
          publishedSlug: json.project.publishedSlug,
          createdAt: json.project.createdAt,
          updatedAt: json.project.updatedAt,
        };
        setSavedProjects((prev) => [copySummary, ...prev]);
        setNotice({ tone: "success", text: `Created copy "${copySummary.title}".` });
        return copySummary;
      } catch {
        setNotice({ tone: "error", text: "Network error while duplicating bouquet." });
        return null;
      }
    },
    [],
  );

  const deleteSavedProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      const headers = workspaceHeaders();
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) {
          setNotice({ tone: "error", text: "Unable to delete saved bouquet." });
          return false;
        }
        setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (currentProjectId === projectId) {
          setCurrentProjectId(null);
          setCurrentProjectTitle(null);
        }
        setNotice({ tone: "info", text: "Removed bouquet draft from My Bouquets." });
        return true;
      } catch {
        setNotice({ tone: "error", text: "Network error while deleting bouquet." });
        return false;
      }
    },
    [currentProjectId],
  );

  const applyFullScene = useCallback(
    (nextScene: BouquetSceneV1, noticeText?: string) => {
      const validated = validateAndNormalizeScene(nextScene, ALLOWED_SKU_IDS);
      if (!validated.ok) {
        setNotice({ tone: "error", text: validated.error });
        return;
      }
      commitSceneChange(() => validated.scene);
      setSelectedIdsState([]);
      setOverlapCandidates([]);
      if (noticeText) {
        setNotice({ tone: "success", text: noticeText });
      }
    },
    [commitSceneChange],
  );

  const clearNotice = useCallback(() => setNotice(null), []);
  const clearPublishError = useCallback(() => setPublishError(null), []);

  const canUndo = historyTick >= 0 && undoStackRef.current.length > 0;
  const canRedo = historyTick >= 0 && redoStackRef.current.length > 0;

  return (
    <StudioContext.Provider
      value={{
        scene,
        selectedIds,
        overlapCandidates,
        multiSelectMode,
        activePresetId,
        canUndo,
        canRedo,
        notice,
        shareState,
        isPublishing,
        publishError,
        draftSavedAt,
        currentProjectId,
        currentProjectTitle,
        savedProjects,
        projectsLoading,
        projectSaving,
        setSelectedIds,
        toggleMultiSelectMode,
        cycleOverlappingStem,
        undo,
        redo,
        clearNotice,
        clearPublishError,
        addStem,
        removeOneBySku,
        removeStems,
        replaceStemSku,
        duplicateStems,
        bringForward,
        sendBackward,
        toggleLockStems,
        flipStemsHorizontal,
        swapStemVariation,
        updateStemsTransform,
        applyCompositionPreset,
        loadStarterPreset,
        resetArrangement,
        startNewBouquet,
        setVessel,
        setBowStyle,
        setRibbonFinish,
        setRibbonColor,
        setStemVisibility,
        setTableSurface,
        applyOccasionTemplate,
        updateCard,
        addPhotoAttachment,
        updatePhotoCaption,
        removePhotoAttachment,
        setVoiceMessage,
        setShowColophon,
        setHideNamesInPreview,
        setIsPublicShowcase,
        publishShareLink,
        refreshSavedProjects,
        saveProjectToServer,
        openSavedProject,
        duplicateSavedProject,
        deleteSavedProject,
        applyFullScene,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudioScene(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudioScene must be used inside StudioSceneProvider");
  return ctx;
}
