export default function WorkspaceLoading() {
  return (
    <div className="page-wrap" aria-live="polite" aria-busy="true">
      <div className="space-y-4">
        <div className="h-7 w-44 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-slate-200/80" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
