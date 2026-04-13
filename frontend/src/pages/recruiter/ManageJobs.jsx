import Navbar from "../../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import { deleteJob as deleteJobApi, updateJob as updateJobApi } from "../../api/company";
import { getJobs } from "../../api/jobs";
import { getApplicantsForJob } from "../../api/application";

export default function ManageJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applicantCounts, setApplicantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const companyId = localStorage.getItem("companyId");

  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split(".")[1])).sub;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getJobs();
      const myJobs = companyId
        ? res.data.filter((job) => job.company?.id === companyId)
        : currentUserId
          ? res.data.filter((job) => job.postedBy?.id === currentUserId)
          : [];
      setJobs(myJobs);
      setLoading(false);

      const applicantPairs = await Promise.all(
        myJobs.map(async (job) => {
          try {
            const applicantsRes = await getApplicantsForJob(job.id);
            return [job.id, applicantsRes.data.length];
          } catch (err) {
            return [job.id, 0];
          }
        })
      );
      setApplicantCounts(Object.fromEntries(applicantPairs));
    } catch (err) {
      console.log("Fetch jobs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [companyId]);

  const handleDelete = async (id) => {
    try {
      await deleteJobApi(id);
      setJobs((prev) => prev.filter((job) => job.id !== id));
    } catch (err) {
      console.log("Delete error:", err);
      alert("Failed to delete job");
    }
  };

  const handleToggleStatus = async (job) => {
    try {
      const nextStatus = job.status === "closed" ? "active" : "closed";
      await updateJobApi(job.id, { status: nextStatus });
      setJobs((prev) =>
        prev.map((item) =>
          item.id === job.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      console.log("Status update error:", err);
      alert("Failed to update job status");
    }
  };

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [jobs]
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="pt-20 flex">
        <RecruiterSidebar />
        <div className="flex-1 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Manage Jobs</h1>
              <p className="text-gray-500">
                Track each posting, update status, and jump into applicants.
              </p>
            </div>

            <Link to="/recruiter/post-job">
              <button className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
                + Post Job
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
              Loading jobs...
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
              No jobs found. Create your first job posting.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {sortedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {job.location || "No location"} - {job.locationType || "onsite"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        job.status === "closed"
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {job.status || "active"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Applicants</p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {applicantCounts[job.id] || 0}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Salary</p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {job.salaryRange || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/recruiter/applicants/${job.id}`)}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      View Applicants
                    </button>
                    <button
                      onClick={() =>
                        navigate("/recruiter/post-job", {
                          state: { job },
                        })
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(job)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {job.status === "closed" ? "Reopen" : "Close"}
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
