import { useEffect, useMemo, useState } from "react";

const formatMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    return "No metadata";
  }

  const entries = Object.entries(metadata).slice(0, 3);
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" | ");
};

const categoryLabelMap = {
  auth: "Auth",
  users: "Users",
  jobs: "Jobs",
  applications: "Applications",
  messages: "Messages",
  admin: "Admin",
  resume: "Resume",
  profile: "Profile",
  system: "System",
};

export default function LogsTable({ logs = [], loading = false, groupedLogs = {}, activeGroup = "all", onGroupChange }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [logs, activeGroup]);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

  const visibleLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page]);

  const pageNumbers = useMemo(() => {
    const windowSize = 4;

    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(page - 1, totalPages - (windowSize - 1)));
    const end = Math.min(totalPages, start + windowSize - 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading audit logs...
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No audit logs available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onGroupChange?.("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeGroup === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            All
          </button>
          {Object.entries(groupedLogs).map(([groupKey, groupItems]) => (
            <button
              key={groupKey}
              type="button"
              onClick={() => onGroupChange?.(groupKey)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeGroup === groupKey ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {categoryLabelMap[groupKey] || groupKey} ({groupItems.length})
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Time</th>
              <th className="px-4 py-3 text-left font-semibold">Action</th>
              <th className="px-4 py-3 text-left font-semibold">Target</th>
              <th className="px-4 py-3 text-left font-semibold">Performed By</th>
              <th className="px-4 py-3 text-left font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {log.action.replaceAll("_", " ")}
                    </span>
                    <p className="text-xs text-slate-400">{log.category || "system"}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-700">
                  <div className="font-medium">{log.targetType || "System"}</div>
                  <div className="mt-1 text-xs text-slate-400 break-all">{log.targetId || "-"}</div>
                </td>
                <td className="px-4 py-4 text-slate-600 break-all">{log.performedBy || "system"}</td>
                <td className="px-4 py-4 text-slate-500">{formatMetadata(log.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {Math.min((page - 1) * pageSize + 1, logs.length)}-
          {Math.min(page * pageSize, logs.length)} of {logs.length} entries
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`min-w-9 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                page === pageNumber
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
