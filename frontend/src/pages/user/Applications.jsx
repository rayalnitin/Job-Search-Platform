import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Timeline from "../../components/Timeline";
import ResumeVault from "../../components/ResumeVault";
import { getMyApplications } from "../../api/application";
import { getResumes } from "../../api/resume";

const statusStyles = {
  applied: "bg-blue-50 text-blue-700",
  reviewed: "bg-amber-50 text-amber-700",
  interviewed: "bg-purple-50 text-purple-700",
  rejected: "bg-red-50 text-red-700",
  offer: "bg-green-50 text-green-700",
};

export default function Applications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const [applicationsRes, resumesRes] = await Promise.all([
          getMyApplications(),
          getResumes(),
        ]);

        const nextApps = applicationsRes.data || [];
        setApps(nextApps);
        setResumes(resumesRes.data || []);
        setSelectedId((current) => current || nextApps[0]?.id || "");
      } catch (err) {
        console.log(err);
        setMessage("Unable to load your applications right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  const selectedApplication =
    apps.find((app) => app.id === selectedId) || apps[0] || null;
  const selectedResume = resumes.find(
    (resume) => resume.id === selectedApplication?.resumeId
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-8">
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-gray-500 mb-8">
            Track your jobs, status updates, and recruiter conversations.
          </p>

          {message && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-7 space-y-6">
              {loading ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                  Loading applications...
                </div>
              ) : apps.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                  No applications yet. Apply to a role from the dashboard to see your history here.
                </div>
              ) : (
                apps.map((app) => {
                  const latestHistory = app.statusHistory?.[app.statusHistory.length - 1];
                  const companyName =
                    typeof app.job.company === "string"
                      ? app.job.company
                      : app.job.company?.name;

                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      className={`cursor-pointer rounded-2xl border bg-white p-6 shadow-sm transition-all ${
                        selectedApplication?.id === app.id
                          ? "border-blue-200 ring-2 ring-blue-100"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {app.job.title}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-blue-600">
                            {companyName || "Company not available"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                statusStyles[app.status] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {app.status}
                            </span>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                              Applied {new Date(app.appliedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {app.recruiter?.id && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate("/messages", {
                                  state: {
                                    selectedUser: {
                                      id: app.recruiter.id,
                                      name: app.recruiter.email,
                                      email: app.recruiter.email,
                                    },
                                  },
                                });
                              }}
                              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                              Message Recruiter
                            </button>
                          )}
                        </div>
                      </div>

                      {app.coverNote && (
                        <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Cover Note
                          </p>
                          <p className="mt-2 text-sm text-gray-600">{app.coverNote}</p>
                        </div>
                      )}

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-gray-100 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Latest Update
                          </p>
                          <p className="mt-2 text-sm text-gray-700 capitalize">
                            {latestHistory?.status || app.status}
                          </p>
                          {latestHistory?.changedAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(latestHistory.changedAt).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-gray-100 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Resume Linked
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            {app.resumeId ? "Resume uploaded and attached" : "No resume linked"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="col-span-12 xl:col-span-5 space-y-6">
              <Timeline application={selectedApplication} />
              <ResumeVault
                application={selectedApplication}
                resume={selectedResume}
                onDownload={() => navigate("/resume")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
