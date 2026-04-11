const formatMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    return "No metadata";
  }

  const entries = Object.entries(metadata).slice(0, 3);
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" | ");
};

export default function LogsTable({ logs = [], loading = false }) {
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
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {log.action.replaceAll("_", " ")}
                  </span>
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
    </div>
  );
}
