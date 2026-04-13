export default function CompanyAbout({ company }) {
  const ownerName = company.createdBy?.name || company.createdBy?.email || "Recruiter";
  const ownerEmail = company.createdBy?.email || null;
  const updatedAt = company.updatedAt ? new Date(company.updatedAt).toLocaleString() : null;

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-5">
      <div>
        <h2 className="font-bold mb-3">About Us</h2>
        <p className="text-gray-500 text-sm">
          {company.description || "No description available"}
        </p>
      </div>

      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Profile owner</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">{ownerName}</p>
        {ownerEmail && <p className="mt-1 text-sm text-gray-500">{ownerEmail}</p>}
        {updatedAt && <p className="mt-2 text-xs text-gray-400">Last updated {updatedAt}</p>}
      </div>

      {company.website && (
        <a
          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Visit Website
        </a>
      )}
    </div>
  );
}