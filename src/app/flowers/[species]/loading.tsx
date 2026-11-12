import { SiteHeader } from "@/components/ui/SiteHeader";
import { SkeletonCardGrid } from "@/components/ui/SkeletonCard";

export default function SpeciesLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3 animate-pulse">
          <div className="h-3.5 w-36 rounded bg-[var(--bg-well)]" />
          <div className="h-10 w-64 rounded bg-[var(--bg-well)]" />
          <div className="h-4 w-96 max-w-full rounded bg-[var(--bg-well)]/70" />
        </div>
        <SkeletonCardGrid count={4} colsClass="sm:grid-cols-2 lg:grid-cols-4" />
      </main>
    </div>
  );
}

