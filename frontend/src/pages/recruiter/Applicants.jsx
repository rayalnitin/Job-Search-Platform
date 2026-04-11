import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import {
  getApplicantsForJob,
  updateApplicationStatus,
} from "../../api/application";

const statusStyles = {
  applied: "bg-blue-50 text-blue-700",
  reviewed: "bg-amber-50 text-amber-700",
  interviewed: "bg-purple-50 text-purple-700",
  rejected: "bg-red-50 text-red-700",
  offer: "bg-green-50 text-green-700",
};

export default function Applicants() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!jobId) {
        setApplicants([]);
        setLoading(false);
        return;
      }

      try {
        const res = await getApplicantsForJob(jobId);
        setApplicants(res.data);
      } catch (err) {
        console.log("Fetch applicants error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [jobId]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateApplicationStatus(id, newStatus);
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.log("Status update error:", err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="pt-20 flex">
        <RecruiterSidebar />
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Review Applicants</h1>
            <p className="text-gray-500">
              {jobId
                ? "Manage candidate status and continue the conversation from one place."
                : "Open a job from Manage Jobs to see its applicants."}
            </p>
          </div>

          {!jobId ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
              Choose a job from Manage Jobs to load applicants for that posting.
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
              Loading applicants...
            </div>
          ) : applicants.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
              No applicants found for this job yet.
            </div>
          ) : (
            <div className="space-y-6">
              {applicants.map((app) => {
                const latestHistory = app.statusHistory?.[app.statusHistory.length - 1];

                return (
                  <div
                    key={app.id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-lg text-gray-900">
                            {app.applicant?.email || "Applicant"}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              statusStyles[app.status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Applied On
                            </p>
                            <p className="mt-1 text-sm text-gray-700">
                              {new Date(app.appliedAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-gray-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Latest Status Change
                            </p>
                            <p className="mt-1 text-sm text-gray-700 capitalize">
                              {latestHistory?.status || app.status}
                            </p>
                          </div>
                        </div>

                        {app.coverNote && (
                          <div className="mt-4 rounded-2xl border border-gray-100 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Cover Note
                            </p>
                            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                              {app.coverNote}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 lg:w-56">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="applied">Applied</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="rejected">Rejected</option>
                          <option value="offer">Offer</option>
                        </select>

                        <button
                          onClick={() =>
                            navigate("/recruiter/messages", {
                              state: {
                                selectedUser: {
                                  id: app.applicant?.id,
                                  name: app.applicant?.email,
                                  email: app.applicant?.email,
                                },
                              },
                            })
                          }
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Message Applicant
                        </button>

                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                          {app.resumeId
                            ? "Resume is linked to this application."
                            : "No resume linked on this application."}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}