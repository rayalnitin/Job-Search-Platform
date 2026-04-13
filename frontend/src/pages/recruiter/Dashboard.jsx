import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import { getJobs } from "../../api/jobs";
import { getApplicantsForJob } from "../../api/application";

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [jobApplicants, setJobApplicants] = useState({});
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

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const jobsRes = await getJobs();
        const myJobs = companyId
          ? jobsRes.data.filter((job) => job.company?.id === companyId)
          : currentUserId
            ? jobsRes.data.filter((job) => job.postedBy?.id === currentUserId)
            : [];

        setJobs(myJobs);
        setLoading(false);

        const applicantPairs = await Promise.all(
          myJobs.map(async (job) => {
            try {
              const res = await getApplicantsForJob(job.id);
              return [job.id, res.data];
            } catch (err) {
              return [job.id, []];
            }
          })
        );

        setJobApplicants(Object.fromEntries(applicantPairs));
      } catch (err) {
        console.log("Recruiter dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [companyId]);

  const stats = useMemo(() => {
    const applicantLists = Object.values(jobApplicants).flat();
    const interviews = applicantLists.filter(
      (app) => app.status === "interviewed"
    ).length;
    const offers = applicantLists.filter((app) => app.status === "offer").length;

    return {
      jobs: jobs.length,
      applicants: applicantLists.length,
      interviews,
      offers,
    };
  }, [jobApplicants, jobs.length]);

  const recentApplications = useMemo(() => {
    return Object.entries(jobApplicants)
      .flatMap(([jobId, applicants]) =>
        applicants.map((app) => ({
          ...app,
          jobId,
          jobTitle: jobs.find((job) => job.id === jobId)?.title || "Job",
        }))
      )
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(0, 5);
  }, [jobApplicants, jobs]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="pt-20 flex">
        <RecruiterSidebar />
        <div className="flex-1 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
              <p className="text-gray-500">
                Overview of your company, open jobs, and recent applicant activity.
              </p>
            </div>

            <Link to="/recruiter/post-job">
              <button className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition">
                + Post Job
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
              Loading recruiter dashboard...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Job Posts</p>
                  <h2 className="text-2xl font-bold mt-2">{stats.jobs}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Applicants</p>
                  <h2 className="text-2xl font-bold mt-2">{stats.applicants}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Interviews</p>
                  <h2 className="text-2xl font-bold mt-2">{stats.interviews}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Offers</p>
                  <h2 className="text-2xl font-bold mt-2">{stats.offers}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] gap-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Recent Applications</h2>
                    <Link to="/recruiter/jobs" className="text-sm text-blue-600 hover:underline">
                      View jobs
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {recentApplications.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No applications yet. Once candidates apply, they will appear here.
                      </p>
                    ) : (
                      recentApplications.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-xl border border-gray-100 p-4 flex flex-col md:flex-row md:items-center gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {app.applicant?.email || "Applicant"}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              Applied for {app.jobTitle}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold capitalize w-fit">
                            {app.status}
                          </span>
                          <Link
                            to={`/recruiter/applicants/${app.jobId}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Open
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Live Jobs</h2>
                    <Link to="/recruiter/jobs" className="text-sm text-blue-600 hover:underline">
                      Manage
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {jobs.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No jobs posted yet. Create your first posting to start hiring.
                      </p>
                    ) : (
                      jobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="rounded-xl bg-gray-50 p-4">
                          <p className="font-semibold text-gray-900">{job.title}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {job.location || "No location"} - {job.locationType || "onsite"}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {jobApplicants[job.id]?.length || 0} applicant(s)
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
