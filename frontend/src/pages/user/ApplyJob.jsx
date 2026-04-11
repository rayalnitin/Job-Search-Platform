import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { applyJob } from "../../api/application";
import { uploadResume } from "../../api/resume";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const tips = [
  "Tailor your resume to match the job description keywords.",
  "Keep your cover note concise. Three to five sentences is ideal.",
  "Use a PDF resume for the most consistent formatting.",
  "Proofread once before you submit.",
];

export default function ApplyJob() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const job = location.state?.job || null;
  const companyName =
    typeof job?.company === "string" ? job.company : job?.company?.name;
  const workMode = job?.remote
    ? "Remote"
    : job?.locationType
      ? job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)
      : null;
  const salary = job?.salary || job?.salaryRange;

  const [coverNote, setCoverNote] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");

  const handleFileSelect = (file) => {
    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only PDF or DOCX files are accepted.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      return;
    }

    setError("");
    setResumeFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!job?.id) {
      setError("Please choose a job from the dashboard before applying.");
      return;
    }

    if (!resumeFile) {
      setError("Please upload your resume before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      setStage("Uploading resume");
      const resumeFormData = new FormData();
      resumeFormData.append("file", resumeFile);

      const uploadRes = await uploadResume(resumeFormData);
      const resumeId = uploadRes.data?.resume?.id;

      if (!resumeId) {
        throw new Error("Resume upload did not return a valid id.");
      }

      setStage("Submitting application");
      await applyJob({
        jobId: job.id,
        resumeId,
        coverNote: coverNote.trim(),
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
      setStage("");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex pt-16">
          <Sidebar />
          <main className="flex flex-1 items-center justify-center p-6 md:ml-64">
            <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Application submitted
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Your application for{" "}
                <span className="font-semibold text-gray-800">
                  {job?.title || "this role"}
                </span>{" "}
                has been sent successfully.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => navigate("/applications")}
                  className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  View Applications
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-full bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Back to Jobs
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 md:ml-64">
          <div className="mx-auto max-w-7xl">
            <button
              onClick={() => navigate("/dashboard")}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to jobs
            </button>

            <div className="mb-6 rounded-3xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                    Application
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-gray-900">
                    {job?.title || "Complete your application"}
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    {companyName || "Select a role from the dashboard"}
                    {job?.location ? ` - ${job.location}` : ""}
                  </p>
                </div>
                {job?.type && (
                  <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                    {job.type}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_340px]">
              <section className="space-y-6">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Upload Resume
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Your resume is uploaded first, then the application is sent using the returned resume id.
                    </p>
                  </div>

                  <div
                    className={`rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
                      dragOver
                        ? "border-blue-500 bg-blue-50"
                        : resumeFile
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) =>
                        handleFileSelect(event.target.files?.[0])
                      }
                    />

                    {resumeFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                          <svg
                            className="h-7 w-7 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(resumeFile.size / 1024).toFixed(1)} KB ready
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setResumeFile(null);
                            setError("");
                          }}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Replace file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                          <svg
                            className="h-7 w-7 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            Drop your resume here or <span className="text-blue-600">browse files</span>
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Supported formats: PDF, DOCX up to 5 MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Your resume is only shared with the hiring team for this job.
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Cover Note
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Optional, but a short note can strengthen your application.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      {coverNote.length}/1000
                    </span>
                  </div>

                  <textarea
                    value={coverNote}
                    onChange={(event) => setCoverNote(event.target.value.slice(0, 1000))}
                    rows={7}
                    placeholder="Write a quick introduction about your experience and why this role is a fit."
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? `${stage}...` : "Submit Application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="rounded-full bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Job Summary
                  </h3>
                  {job ? (
                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Role
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {job.title || "Untitled role"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Company
                        </p>
                        <p className="mt-1 text-sm font-medium text-blue-600">
                          {companyName || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Location
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {job.location || "Not specified"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {job.type && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {job.type}
                          </span>
                        )}
                        {workMode && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                            {workMode}
                          </span>
                        )}
                        {salary && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            {salary}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      No job selected yet. Go back to the dashboard and choose a role first.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Application Tips
                  </h3>
                  <div className="mt-4 space-y-3">
                    {tips.map((tip) => (
                      <div key={tip} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                        <p className="text-sm text-gray-500">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}