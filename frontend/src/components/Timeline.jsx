const STATUS_LABELS = {
  applied: "Applied",
  reviewed: "Reviewed",
  interviewed: "Interviewing",
  offer: "Offer Pending",
  rejected: "Rejected",
};

const BASE_FLOW = ["applied", "reviewed", "interviewed", "offer"];

export default function Timeline({ application }) {
  if (!application) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Status Timeline</h3>
        <p className="mt-4 text-sm text-gray-500">
          Select an application to see recruiter progress updates.
        </p>
      </div>
    );
  }

  const historyByStatus = new Map(
    (application.statusHistory || []).map((entry) => [entry.status, entry])
  );

  const currentStatus = application.status || "applied";
  const currentIndex = BASE_FLOW.indexOf(currentStatus);
  const steps = currentStatus === "rejected" ? [...BASE_FLOW, "rejected"] : BASE_FLOW;

  const getStepState = (status, index) => {
    if (status === "rejected") {
      return currentStatus === "rejected" ? "current" : "upcoming";
    }

    if (index === currentIndex) {
      return "current";
    }

    if (currentIndex >= 0 && index < currentIndex) {
      return "complete";
    }

    if (historyByStatus.has(status) && currentStatus === "rejected") {
      return "complete";
    }

    return "upcoming";
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Status Timeline</h3>
          <p className="mt-1 text-sm text-gray-500">
            Real updates from your application history.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
          {STATUS_LABELS[currentStatus] || currentStatus}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((status, index) => {
          const state = getStepState(status, index);
          const historyEntry = historyByStatus.get(status);
          const dotClass =
            state === "complete"
              ? "border-emerald-500 bg-emerald-500 text-white"
              : state === "current"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white text-transparent";
          const titleClass =
            state === "current"
              ? "text-blue-700"
              : state === "complete"
                ? "text-gray-900"
                : "text-gray-400";

          return (
            <div key={status} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${dotClass}`}
                >
                  {state === "complete" ? "✓" : "•"}
                </div>
                {index < steps.length - 1 && (
                  <div className="mt-2 h-8 w-px bg-gray-200" />
                )}
              </div>
              <div className="pt-0.5">
                <p className={`text-base font-semibold ${titleClass}`}>
                  {STATUS_LABELS[status] || status}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {historyEntry?.changedAt
                    ? new Date(historyEntry.changedAt).toLocaleString()
                    : state === "upcoming"
                      ? "Waiting for recruiter update"
                      : "Update recorded"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
