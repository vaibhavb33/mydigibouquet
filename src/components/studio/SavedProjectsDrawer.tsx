"use client";

import React, { useEffect, useState } from "react";
import { OCCASION_TEMPLATES } from "@/engine/occasions";
import { useStudioScene } from "./StudioSceneProvider";

function formatUpdatedAt(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SavedProjectsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    scene,
    currentProjectId,
    currentProjectTitle,
    savedProjects,
    projectsLoading,
    projectSaving,
    refreshSavedProjects,
    saveProjectToServer,
    openSavedProject,
    duplicateSavedProject,
    deleteSavedProject,
    startNewBouquet,
  } = useStudioScene();

  const [titleDraft, setTitleDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fallbackTitle =
      currentProjectTitle ||
      (scene.card.recipientName.trim()
        ? `For ${scene.card.recipientName.trim()}`
        : scene.occasionTag && scene.occasionTag in OCCASION_TEMPLATES
          ? `${OCCASION_TEMPLATES[scene.occasionTag].label} Bouquet`
          : "My Seasonal Arrangement");
    setTitleDraft(fallbackTitle);
    void refreshSavedProjects();
  }, [open, currentProjectTitle, scene.card.recipientName, scene.occasionTag, refreshSavedProjects]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async (saveAsNew: boolean) => {
    await saveProjectToServer(titleDraft, { saveAsNew });
  };

  const handleOpen = async (id: string) => {
    setBusyId(id);
    const ok = await openSavedProject(id);
    setBusyId(null);
    if (ok) onClose();
  };

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    await duplicateSavedProject(id);
    setBusyId(null);
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    await deleteSavedProject(id);
    setBusyId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Saved Bouquet Drafts"
      data-testid="saved-projects-drawer"
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              My Saved Bouquets
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Save drafts to your workspace, reopen to edit, duplicate, or manage versions.
            </p>
          </div>
          <button
            type="button"
            data-testid="close-projects-drawer"
            onClick={onClose}
            className="min-h-[34px] rounded-full border border-[var(--border-hairline)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            Close
          </button>
        </div>

        {/* Save Current Arrangement Form */}
        <div className="space-y-2.5 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {currentProjectId ? "Update Active Project" : "Save Current Canvas"}
            </span>
            <button
              type="button"
              onClick={() => {
                startNewBouquet();
                onClose();
              }}
              className="text-[11px] font-medium text-[var(--accent-primary)] hover:underline"
            >
              + New Blank Draft
            </button>
          </div>

          <input
            type="text"
            value={titleDraft}
            maxLength={80}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="Name your bouquet project..."
            data-testid="project-title-input"
            className="w-full rounded-xl border border-[var(--border-hairline)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={projectSaving}
              onClick={() => handleSave(false)}
              data-testid="save-project-btn"
              className="min-h-[36px] flex-1 rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
            >
              {projectSaving
                ? "Saving..."
                : currentProjectId
                  ? "Save Updates"
                  : "Save Project Draft"}
            </button>
            {currentProjectId && (
              <button
                type="button"
                disabled={projectSaving}
                onClick={() => handleSave(true)}
                data-testid="save-as-new-project-btn"
                className="min-h-[36px] rounded-xl border border-[var(--border-hairline)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] disabled:opacity-60"
              >
                Save as Copy
              </button>
            )}
          </div>
        </div>

        {/* Saved Projects List */}
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
          {projectsLoading && savedProjects.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--text-muted)]">
              Loading saved bouquets...
            </p>
          ) : savedProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-canvas)]/50 p-6 text-center">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                No saved bouquet projects yet
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Save your current bouquet above so you can reopen, tweak, or duplicate it anytime.
              </p>
            </div>
          ) : (
            savedProjects.map((project) => {
              const isCurrent = project.id === currentProjectId;
              const isBusy = busyId === project.id;
              const occasionLabel =
                project.occasionTag && project.occasionTag in OCCASION_TEMPLATES
                  ? OCCASION_TEMPLATES[project.occasionTag].label
                  : null;

              return (
                <article
                  key={project.id}
                  data-testid={`saved-project-card-${project.id}`}
                  className={`rounded-2xl border p-3.5 transition ${
                    isCurrent
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-soft)]/50"
                      : "border-[var(--border-hairline)] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-medium text-[var(--text-primary)]">
                        {project.title}
                      </h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <span>{project.stemCount} stems</span>
                        {occasionLabel && <span>• {occasionLabel}</span>}
                        <span>• {formatUpdatedAt(project.updatedAt)}</span>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleOpen(project.id)}
                      data-testid={`open-project-${project.id}`}
                      className="min-h-[30px] flex-1 rounded-lg bg-[var(--accent-primary)] px-2.5 text-[11px] font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
                    >
                      Reopen &amp; Edit
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDuplicate(project.id)}
                      data-testid={`duplicate-project-${project.id}`}
                      className="min-h-[30px] rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)] disabled:opacity-60"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(project.id)}
                      data-testid={`delete-project-${project.id}`}
                      className="min-h-[30px] rounded-lg border border-[var(--border-hairline)] bg-white px-2.5 text-[11px] font-medium text-[#8C332B] hover:border-[#8C332B] disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

