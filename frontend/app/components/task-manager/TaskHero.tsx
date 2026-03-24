type TaskHeroProps = {
  openCount: number;
  inProgressCount: number;
  completedCount: number;
  totalCount: number;
  page: number;
  perPage: number;
  query: string;
  status: string;
};

export function TaskHero({
  openCount,
  inProgressCount,
  completedCount,
  totalCount,
  page,
  perPage,
  query,
  status,
}: TaskHeroProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.09)] backdrop-blur">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-b border-slate-200/70 p-5 sm:p-7 xl:border-b-0 xl:border-r">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                Task Manager
              </p>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                Full-stack workspace
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Search, create, update, and close tasks from one compact workspace.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                Open-text search is always visible and goes straight to the Rails API backed by PostgreSQL full-text and trigram search.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Open</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{openCount}</p>
                <p className="mt-1 text-sm text-slate-600">Ready for action</p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">In Progress</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{inProgressCount}</p>
                <p className="mt-1 text-sm text-slate-600">Currently moving</p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Completed</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{completedCount}</p>
                <p className="mt-1 text-sm text-slate-600">Already shipped</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#155e75_100%)] p-5 text-white sm:p-7">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Current view</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Visible</p>
                <p className="mt-1 text-2xl font-semibold">{totalCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Page</p>
                <p className="mt-1 text-2xl font-semibold">{page}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Per Page</p>
                <p className="mt-1 text-2xl font-semibold">{perPage}</p>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-black/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Active filter</p>
              <p className="mt-2 text-base font-semibold text-white">
                {query ? `"${query}"` : "No search text"}
              </p>
              <p className="mt-1 text-sm text-slate-300">Status: {status || "all"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
