import { useNavigate } from "react-router-dom";

export default function JobCard({ job, applied = false }) {
  const navigate = useNavigate();
  const companyName =
    typeof job.company === "string" ? job.company : job.company?.name;
  const companyId = typeof job.company === "object" ? job.company?.id : null;
  const workMode = job.remote
    ? "Remote"
    : job.locationType
      ? job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)
      : null;
  const salary = job.salary || job.salaryRange;

  const handleApply = () => {
    navigate("/apply", { state: { job } });
  };

  const handleOpenCompany = () => {
    if (companyId) {
      navigate(`/company/${companyId}`);
    }
  };

  const buttonClasses = applied
    ? "flex-shrink-0 px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-full cursor-not-allowed"
    : "flex-shrink-0 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-base truncate">
          {job.title || job.name}
        </h3>

        <div className="flex items-center gap-1 mt-0.5">
          {companyName && (
            <button
              type="button"
              onClick={handleOpenCompany}
              disabled={!companyId}
              className={`text-sm ${companyId ? "text-blue-600 hover:underline" : "text-blue-600 cursor-default"}`}
            >
              {companyName}
            </button>
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
        onClick={applied ? undefined : handleApply}
        disabled={applied}
        className={`${buttonClasses} w-full sm:w-auto`}
      >
        {applied ? "Already Applied" : "Apply"}
      </button>
    </div>
  );
}