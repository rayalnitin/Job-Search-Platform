import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import SearchBar from "../../components/SearchBar";
import JobCard from "../../components/JobCard";
import { useEffect, useState } from "react";
import { getJobs } from "../../api/jobs";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});

  const fetchJobs = async (filters = {}) => {
    try {
      setLoading(true);
      const res = await getJobs(filters);
      setJobs(res.data);
      setActiveFilters(filters);
    } catch (err) {
      console.log("Fetch jobs error:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-6">
          <SearchBar onSearch={fetchJobs} loading={loading} />

          <div className="mt-8 mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Recommended Jobs</h2>
            {Object.keys(activeFilters).length > 0 && (
              <p className="text-sm text-gray-500">
                {jobs.length} result{jobs.length === 1 ? "" : "s"} found
              </p>
            )}
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                No jobs matched your search. Try changing keyword, location,
                type, work mode, or skill.
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
