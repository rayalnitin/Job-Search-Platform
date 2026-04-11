import { useNavigate } from "react-router-dom";

export default function JobCard({ job }) {
  const navigate = useNavigate();
  const companyName =
    typeof job.company === "string" ? job.company : job.company?.name;
  const workMode = job.remote
    ? "Remote"
    : job.locationType
      ? job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)
      : null;
  const salary = job.salary || job.salaryRange;

  const handleApply = () => {
    navigate("/apply", { state: { job } });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-base truncate">
          {job.title || job.name}
        </h3>

        <div className="flex items-center gap-1 mt-0.5">
          {companyName && (
            <span className="text-sm text-blue-600">{companyName}</span>
          )}
          {job.location && (
            <>
              <span className="text-gray-300">-</span>
              <span className="text-sm text-gray-500">{job.location}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {job.type && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {job.type}
            </span>
          )}
          {workMode && (
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              {workMode}
            </span>
          )}
          {salary && (
            <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
              {salary}
            </span>
          )}
          {Array.isArray(job.skills) &&
            job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
        </div>
      </div>

      <button
        onClick={handleApply}
        className="flex-shrink-0 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all"
      >
        Apply
      </button>
    </div>
  );
}