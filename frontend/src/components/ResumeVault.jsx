export default function ResumeVault({ application, resume, onDownload }) {
  if (!application) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Secure Resume Vault</h3>
        <p className="mt-4 text-sm text-gray-500">
          Choose an application to see which resume is attached.
        </p>
      </div>
    );
  }

  const hasResume = Boolean(application.resumeId && resume);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Secure Resume Vault</h3>
          <p className="mt-1 text-sm text-gray-500">
            Resume attachment for the selected application.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Encrypted
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-sm font-semibold text-red-500">
            PDF
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {hasResume ? resume.filename : "No resume linked"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {hasResume
                ? `Uploaded ${new Date(resume.createdAt).toLocaleDateString()}${resume.isActive ? " • Active version" : ""}`
                : "Upload a resume during apply flow to link it here."}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!hasResume}
        onClick={() => hasResume && onDownload?.(resume.id, resume.filename)}
        className="mt-4 w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
      >
        {hasResume ? "Download Attached Resume" : "Resume Not Available"}
      </button>
    </div>
  );
}
