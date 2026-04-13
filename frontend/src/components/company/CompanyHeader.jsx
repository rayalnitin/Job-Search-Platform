export default function CompanyHeader({ company }) {
  const ownerName = company.createdBy?.name || company.createdBy?.email || "Recruiter";
  const lastUpdated = company.updatedAt
    ? new Date(company.updatedAt).toLocaleDateString()
    : null;

  return (
    <div className="relative">
      <div className="h-60 rounded-3xl bg-gradient-to-r from-blue-100 via-indigo-50 to-slate-100" />
      <div className="mt-[-56px] flex items-end gap-6 px-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-600 text-xl font-bold text-white shadow-lg">
          {company.name?.charAt(0)}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-500 mt-1">
            {company.location || "Location"} - {company.website || "Company profile"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-600">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm border border-gray-100">
              Managed by {ownerName}
            </span>
            {lastUpdated && (
              <span className="rounded-full bg-white px-3 py-1 shadow-sm border border-gray-100">
                Updated {lastUpdated}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}