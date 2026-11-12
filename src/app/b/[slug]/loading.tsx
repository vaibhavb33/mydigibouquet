export default function SharedBouquetLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-canvas)] px-5 text-center text-[var(--text-primary)]">
      <div className="w-full max-w-md animate-pulse space-y-6 rounded-3xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10">
        <div className="mx-auto h-20 w-20 rounded-full bg-[var(--bg-well)]" />
        <div className="mx-auto h-7 w-56 rounded bg-[var(--bg-well)]" />
        <div className="mx-auto h-4 w-40 rounded bg-[var(--bg-well)]/70" />
      </div>
    </div>
  );
}

