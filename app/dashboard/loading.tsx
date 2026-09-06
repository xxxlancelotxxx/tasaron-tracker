export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950" aria-label="Panel yükleniyor" role="status">
      <div className="h-16 border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80" />
      <div className="mx-auto max-w-7xl animate-pulse space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-[118px] rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
        <div className="h-[420px] rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-64 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
        <div className="h-72 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    </main>
  );
}
