import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const initialUiFilters = {
  fullTime: false,
  remote: false,
  contract: false,
  minSalary: 0,
  skills: [],
};

const skillTags = ["React", "Python"];

export default function Sidebar({
  filterState,
  onApplyFilters,
  onResetFilters,
  salaryRangeMax = 1000000,
}) {
  const location = useLocation();
  const pathname = location.pathname;
  const showFilters = pathname === "/dashboard";

  const [draftFilters, setDraftFilters] = useState(filterState || initialUiFilters);

  useEffect(() => {
    setDraftFilters(filterState || initialUiFilters);
  }, [filterState]);

  const maxSalary = useMemo(
    () => (salaryRangeMax > 0 ? salaryRangeMax : 1000000),
    [salaryRangeMax]
  );

  const active = (path) =>
    pathname === path || (path === "/dashboard" && pathname === "/apply")
      ? "rounded-2xl bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-700"
      : "rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900";

  const toggleSkill = (skill) => {
    setDraftFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((item) => item !== skill)
        : [...prev.skills, skill],
    }));
  };

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 pt-4 md:block">
      <div className="flex h-full flex-col overflow-y-auto space-y-8 p-4">
        <section>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-blue-800">Management</h2>
          <div className="space-y-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
            <Link to="/dashboard" className={active("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/applications" className={active("/applications")}>
              Applications
            </Link>
          </div>
        </section>

        {showFilters && (
          <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                Live
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 rounded-2xl px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={draftFilters.fullTime}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, fullTime: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span>Full-time</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={draftFilters.remote}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, remote: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span>Remote</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl px-2 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={draftFilters.contract}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, contract: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span>Contract</span>
              </label>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-400">
                <span>Min Salary</span>
                <span>{draftFilters.minSalary.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxSalary}
                step={Math.max(1000, Math.round(maxSalary / 50))}
                value={Math.min(draftFilters.minSalary, maxSalary)}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    minSalary: Number(event.target.value),
                  }))
                }
                className="mt-3 w-full accent-blue-600"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {skillTags.map((skill) => {
                const selected = draftFilters.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => onApplyFilters?.(draftFilters)}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftFilters(initialUiFilters);
                  onResetFilters?.();
                }}
                className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
