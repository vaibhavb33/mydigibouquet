"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StudioSceneProvider, useStudioScene } from "./StudioSceneProvider";
import { AiAssistantDrawer } from "./AiAssistantDrawer";
import { BotanicalLibraryPanel } from "./BotanicalLibraryPanel";
import { FinalSharePreviewStage } from "./FinalSharePreviewStage";
import { GuidedStudioExperience } from "./GuidedStudioExperience";
import { InspectorAndFinishingPanel, type RightPanelTab } from "./InspectorAndFinishingPanel";
import { QuickCreateFlow } from "./QuickCreateFlow";
import { SavedProjectsDrawer } from "./SavedProjectsDrawer";
import { StudioCanvasViewport } from "./StudioCanvasViewport";
import { trackPrivacySafeEvent } from "@/lib/analytics";

export type StudioWorkflowStep = 1 | 2 | 3 | 4 | 5;
export type StudioMode = "guided" | "quick" | "studio";
type MobileDrawerMode = "none" | "library" | "inspect" | "finish" | "card" | "share";

const WORKFLOW_STEPS: ReadonlyArray<{
  step: StudioWorkflowStep;
  mobileLabel: string;
  shortLabel: string;
  label: string;
}> = [
    { step: 1, mobileLabel: "Flowers", shortLabel: "1. Flowers", label: "1. Select Flowers" },
    { step: 2, mobileLabel: "Greens", shortLabel: "2. Greens", label: "2. Select Greenery" },
    { step: 3, mobileLabel: "Arrange", shortLabel: "3. Arrange", label: "3. Arrange & Wrap" },
    { step: 4, mobileLabel: "Card", shortLabel: "4. Card", label: "4. Personalize Card" },
    { step: 5, mobileLabel: "Share", shortLabel: "5. Share", label: "5. Share Bouquet" },
  ];

function useIsDesktopLg(): boolean {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

function StudioKeyboardBridge() {
  const { undo, redo, removeStems, setSelectedIds, selectedIds } = useStudioScene();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y")) {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        removeStems();
      } else if (e.key === "Escape" && selectedIds.length > 0) {
        setSelectedIds([]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, removeStems, selectedIds, setSelectedIds, undo]);

  return null;
}

function StudioInnerLayout({ initialMode = "guided" }: { initialMode?: StudioMode }) {
  const { scene, draftSavedAt } = useStudioScene();
  const isDesktop = useIsDesktopLg();
  const [studioMode, setStudioMode] = useState<StudioMode>(initialMode);
  const [activeStep, setActiveStep] = useState<StudioWorkflowStep>(initialMode === "studio" ? 1 : 3);
  const [rightTab, setRightTab] = useState<RightPanelTab>("finish");
  const [leftCatalogOpen, setLeftCatalogOpen] = useState(true);
  const [mobileDrawer, setMobileDrawer] = useState<MobileDrawerMode>("none");
  const [aiOpen, setAiOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);

  useEffect(() => {
    trackPrivacySafeEvent("studio_opened");
  }, []);

  const handleStepSelect = (step: StudioWorkflowStep, openMobile = true) => {
    setActiveStep(step);
    if (step === 1 || step === 2) {
      setRightTab("finish");
      if (!isDesktop && openMobile) setMobileDrawer("library");
    } else if (step === 3) {
      setRightTab("finish");
      if (!isDesktop && openMobile) setMobileDrawer("finish");
    } else if (step === 4) {
      setRightTab("card");
      if (!isDesktop && openMobile) setMobileDrawer("card");
    } else {
      setRightTab("share");
      if (!isDesktop && openMobile) setMobileDrawer("share");
    }
  };

  const handleOpenInspectFromCanvas = () => {
    setRightTab("inspect");
    if (!isDesktop && mobileDrawer !== "none") {
      setMobileDrawer("inspect");
    }
  };

  const switchToAdvancedStudio = (targetStep: StudioWorkflowStep = 3) => {
    setStudioMode("studio");
    handleStepSelect(targetStep, false);
  };

  // Dedicated Guided Studio Experience (clean, single-header, canvas-dominant)
  if (studioMode === "guided") {
    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-[var(--bg-canvas)]">
        <StudioKeyboardBridge />
        <GuidedStudioExperience
          onSwitchToAdvanced={() => switchToAdvancedStudio(activeStep)}
          onOpenProjects={() => setProjectsOpen(true)}
          onOpenAi={() => setAiOpen(true)}
        />
        <SavedProjectsDrawer open={projectsOpen} onClose={() => setProjectsOpen(false)} />
        <AiAssistantDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <StudioKeyboardBridge />

      {/* Top Atelier Header */}
      <header className="flex min-h-[54px] shrink-0 items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 sm:px-4 md:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="truncate font-display text-base font-semibold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent-primary)] sm:text-lg md:text-xl"
          >
            Petal &amp; Prose
          </Link>

          {/* Multi-Mode Switcher: Guided Studio vs Quick Create vs Advanced Studio */}
          <div
            role="group"
            aria-label="Creation mode"
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-well)]/75 p-0.5"
          >
            <button
              type="button"
              data-testid="mode-guided-btn"
              aria-pressed={(studioMode as StudioMode) === "guided"}
              onClick={() => setStudioMode("guided")}
              className={`min-h-[30px] rounded-full px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${(studioMode as StudioMode) === "guided"
                ? "bg-[var(--text-primary)] text-white shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              <span className="sm:hidden">Guided</span>
              <span className="hidden sm:inline">Guided Studio</span>
            </button>
            <button
              type="button"
              data-testid="mode-quick-btn"
              aria-pressed={studioMode === "quick"}
              onClick={() => setStudioMode("quick")}
              className={`min-h-[30px] rounded-full px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${studioMode === "quick"
                ? "bg-[var(--text-primary)] text-white shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              <span className="sm:hidden">Quick</span>
              <span className="hidden sm:inline">Quick Create</span>
            </button>
            <button
              type="button"
              data-testid="mode-studio-btn"
              aria-pressed={studioMode === "studio"}
              onClick={() => switchToAdvancedStudio(studioMode === "quick" ? 3 : activeStep)}
              className={`min-h-[30px] rounded-full px-2.5 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${studioMode === "studio"
                ? "bg-[var(--text-primary)] text-white shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              <span className="sm:hidden">Advanced</span>
              <span className="hidden sm:inline">Advanced Studio</span>
            </button>
          </div>

          {draftSavedAt && (
            <span
              data-testid="draft-saved-badge"
              className="hidden shrink-0 items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-white px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] xl:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
              Draft saved
            </span>
          )}
        </div>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-2.5" aria-label="Studio navigation">
          <Link
            href="/flowers"
            className="hidden text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] xl:inline-block"
          >
            Flowers
          </Link>
          <Link
            href="/gallery"
            className="hidden text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] xl:inline-block"
          >
            Gallery
          </Link>
          <button
            type="button"
            data-testid="open-ai-assistant-btn"
            onClick={() => setAiOpen(true)}
            className="inline-flex min-h-[32px] shrink-0 items-center rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary-soft)] px-2.5 text-[11px] font-semibold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)] hover:text-white sm:min-h-[34px] sm:px-3 sm:text-xs"
          >
            <span className="sm:hidden">AI</span>
            <span className="hidden sm:inline">AI Florist</span>
          </button>
          <button
            type="button"
            data-testid="open-projects-btn"
            onClick={() => setProjectsOpen(true)}
            className="inline-flex min-h-[32px] shrink-0 items-center rounded-full border border-[var(--border-hairline)] bg-white px-2.5 text-[11px] font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] sm:min-h-[34px] sm:px-3 sm:text-xs"
          >
            <span className="sm:hidden">Drafts</span>
            <span className="hidden sm:inline">My Bouquets</span>
          </button>
          <span className="hidden text-xs text-[var(--text-muted)] lg:inline">
            {scene.stems.length} stems
          </span>
          {studioMode === "studio" && (
            <button
              type="button"
              onClick={() => handleStepSelect(5)}
              className="hidden min-h-[34px] shrink-0 rounded-full bg-[var(--accent-primary)] px-3.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] sm:inline-flex sm:items-center"
            >
              Export &amp; Share
            </button>
          )}
        </nav>
      </header>

      {/* MODE A: QUICK CREATE */}
      {studioMode === "quick" ? (
        <QuickCreateFlow
          onSwitchToStudio={() => switchToAdvancedStudio(3)}
          onOpenAi={() => setAiOpen(true)}
        />
      ) : (
        <>
          {/* MODE B: ADVANCED STUDIO STEPPER */}
          <div
            role="navigation"
            aria-label="Five-step bouquet creation workflow"
            className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/95 px-2 py-1.5 md:px-5"
          >
            <div className="grid flex-1 grid-cols-5 gap-1 md:flex md:items-center md:gap-1.5">
              {WORKFLOW_STEPS.map((item) => {
                const current = activeStep === item.step;
                const completed = activeStep > item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    data-testid={`workflow-step-${item.step}`}
                    aria-current={current ? "step" : undefined}
                    onClick={() => handleStepSelect(item.step)}
                    className={`min-h-[32px] rounded-full px-1 text-[11px] font-semibold transition sm:px-2 md:px-3.5 md:text-xs ${current
                      ? "bg-[var(--accent-primary)] text-white shadow-2xs"
                      : completed
                        ? "bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]"
                        : "bg-[var(--bg-well)]/70 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      }`}
                  >
                    <span className="md:hidden">{item.mobileLabel}</span>
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Quick Panel & Step Controls */}
            <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
              {activeStep !== 5 && (
                <button
                  type="button"
                  onClick={() => setLeftCatalogOpen((prev) => !prev)}
                  className="min-h-[30px] rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {leftCatalogOpen ? "Hide Stems" : "Show Stems"}
                </button>
              )}
              {activeStep > 1 && (
                <button
                  type="button"
                  data-testid="step-prev-btn"
                  onClick={() => handleStepSelect((activeStep - 1) as StudioWorkflowStep)}
                  className="min-h-[30px] rounded-full border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ← Back
                </button>
              )}
              {activeStep < 5 && (
                <button
                  type="button"
                  data-testid="step-next-btn"
                  onClick={() => handleStepSelect((activeStep + 1) as StudioWorkflowStep)}
                  className="min-h-[30px] rounded-full border border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white"
                >
                  Next: {WORKFLOW_STEPS[activeStep]?.mobileLabel} →
                </button>
              )}
            </div>
          </div>

          {/* Main Responsive Workspace: Desktop 3-Pane / Mobile Stack */}
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {isDesktop && activeStep !== 5 && leftCatalogOpen && (
              <aside className="w-[300px] shrink-0 border-r border-[var(--border-hairline)] xl:w-[328px]">
                <BotanicalLibraryPanel activeStep={activeStep} onStepChange={handleStepSelect} />
              </aside>
            )}

            {/* Center Canvas Workspace OR Step 5 Final Share Preview */}
            <main className="relative min-w-0 flex-1">
              {activeStep === 5 ? (
                <FinalSharePreviewStage onBackToStep={(step) => handleStepSelect(step)} />
              ) : (
                <StudioCanvasViewport onRequestInspectTab={handleOpenInspectFromCanvas} />
              )}
            </main>

            {isDesktop && (
              <aside className="w-[338px] shrink-0 border-l border-[var(--border-hairline)] xl:w-[368px]">
                <InspectorAndFinishingPanel
                  activeTab={rightTab}
                  onTabChange={(tab) => {
                    setRightTab(tab);
                    if (tab === "card") setActiveStep(4);
                    else if (tab === "share") setActiveStep(5);
                    else if (activeStep === 4 || activeStep === 5) setActiveStep(3);
                  }}
                  onNavigateStep={(s) => handleStepSelect(s)}
                />
              </aside>
            )}
          </div>

          {/* Mobile & Tablet (< lg) Compact Bottom Bar + Non-Overlapping Drawer */}
          {!isDesktop && (
            <div className="shrink-0 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
              {mobileDrawer !== "none" && (
                <div className="flex h-[52vh] max-h-[460px] flex-col border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                  <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      {mobileDrawer === "library"
                        ? activeStep === 2
                          ? "Greenery & Fillers"
                          : "Botanical Library"
                        : `Studio • ${mobileDrawer}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobileDrawer("none")}
                      className="min-h-[32px] rounded-lg px-2.5 text-xs font-semibold text-[var(--accent-primary)]"
                    >
                      Done
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {mobileDrawer === "library" ? (
                      <BotanicalLibraryPanel activeStep={activeStep} onStepChange={handleStepSelect} />
                    ) : (
                      <InspectorAndFinishingPanel
                        activeTab={mobileDrawer as RightPanelTab}
                        onTabChange={(t) => setMobileDrawer(t)}
                        onNavigateStep={(s) => handleStepSelect(s)}
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-1 p-1.5">
                {(
                  [
                    { id: "library", label: "Flowers" },
                    { id: "inspect", label: "Stem" },
                    { id: "finish", label: "Style" },
                    { id: "card", label: "Card" },
                    { id: "share", label: "Share" },
                  ] as const
                ).map((item) => {
                  const active = mobileDrawer === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`mobile-nav-${item.id}`}
                      onClick={() => {
                        if (item.id === "card") setActiveStep(4);
                        else if (item.id === "share") setActiveStep(5);
                        else if (item.id === "finish" || item.id === "inspect") setActiveStep(3);
                        setMobileDrawer(active ? "none" : item.id);
                      }}
                      className={`min-h-[42px] rounded-xl text-xs font-semibold transition ${active
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-well)]/60 text-[var(--text-secondary)]"
                        }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <AiAssistantDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
      <SavedProjectsDrawer open={projectsOpen} onClose={() => setProjectsOpen(false)} />
    </div>
  );
}

export function StudioShell({
  initialPresetSlug,
  initialOccasionSlug,
  initialStemSlug,
  initialMode = "guided",
}: {
  initialPresetSlug?: string | null;
  initialOccasionSlug?: string | null;
  initialStemSlug?: string | null;
  initialMode?: StudioMode;
}) {
  return (
    <StudioSceneProvider
      initialPresetSlug={initialPresetSlug}
      initialOccasionSlug={initialOccasionSlug}
      initialStemSlug={initialStemSlug}
    >
      <StudioInnerLayout initialMode={initialMode} />
    </StudioSceneProvider>
  );
}
