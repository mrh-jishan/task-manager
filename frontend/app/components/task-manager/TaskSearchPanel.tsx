import { Form, Link } from "react-router";

import { TASK_STATUSES } from "../../lib/tasks";

type TaskSearchPanelProps = {
  q: string;
  status: string;
  hasActiveFilters: boolean;
};

export function TaskSearchPanel({ q, status, hasActiveFilters }: TaskSearchPanelProps) {
  return (
    <section className="rounded-[2rem] border border-cyan-950/10 bg-[linear-gradient(135deg,_#082f49_0%,_#0f172a_58%,_#1f2937_100%)] p-5 text-white shadow-[0_26px_80px_rgba(8,47,73,0.32)] sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-end">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Search
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Find tasks with open-text search</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Search title and description with keywords, phrases, or rough spelling. This is wired directly to the backend `q` parameter.
          </p>

          <Form method="get" className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_220px_auto_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Search text
              </span>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search tasks, notes, tickets, customer issues, release work..."
                className="rounded-[1.2rem] border border-cyan-400/15 bg-white/8 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-black/15"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Status
              </span>
              <select
                name="status"
                defaultValue={status}
                className="rounded-[1.2rem] border border-cyan-400/15 bg-white/8 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:bg-black/15"
              >
                <option value="">All statuses</option>
                {TASK_STATUSES.map((taskStatus) => (
                  <option key={taskStatus} value={taskStatus}>
                    {taskStatus.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-[1.2rem] bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 lg:self-end"
            >
              Search
            </button>

            <Link
              to="/"
              className={`rounded-[1.2rem] px-5 py-3 text-sm font-semibold transition lg:self-end ${
                hasActiveFilters
                  ? "border border-white/15 bg-white/7 text-white hover:border-cyan-300/50"
                  : "pointer-events-none border border-white/8 bg-white/5 text-slate-500"
              }`}
            >
              Clear
            </Link>
          </Form>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-black/12 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Search qualities
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-slate-300">
            <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1">Typos</span>
            <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1">Phrases</span>
            <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1">Status filter</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-200">
            <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1">
              Query: {q ? `"${q}"` : "none"}
            </span>
            <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1">
              Status: {status || "all"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
