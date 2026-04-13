import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import SearchBar from "../../components/SearchBar";
import JobCard from "../../components/JobCard";
import { getJobs } from "../../api/jobs";

const initialSidebarFilters = {
  fullTime: false,
  remote: false,
  contract: false,
  minSalary: 0,
  skills: [],
};

const extractMinSalary = (salaryValue) => {
  if (!salaryValue) {
    return 0;
  }

  const numbers = String(salaryValue)
    .match(/\d+/g)
    ?.map((value) => Number(value))
    .filter((value) => !Number.isNaN(value));

  if (!numbers?.length) {
    return 0;
  }

  return Math.min(...numbers);
};

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryFilters, setQueryFilters] = useState({});
  const [sidebarFilters, setSidebarFilters] = useState(initialSidebarFilters);

  const fetchJobs = async (filters = queryFilters) => {
    try {
      setLoading(true);
      const res = await getJobs(filters);
      setJobs(res.data);
      setQueryFilters(filters);
    } catch (err) {
      console.log("Fetch jobs error:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs({});
  }, []);

  const salaryRangeMax = useMemo(() => {
    const salaries = jobs.map((job) => extractMinSalary(job.salary || job.salaryRange));
    const computedMax = Math.max(...salaries, 0);
    return computedMax > 0 ? computedMax : 1000000;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const salary = extractMinSalary(job.salary || job.salaryRange);
      const skills = Array.isArray(job.skills)
        ? job.skills.map((skill) => String(skill).toLowerCase())
        : [];

      if (sidebarFilters.fullTime && job.type !== "full-time") {
        return false;
      }

      if (sidebarFilters.remote && job.locationType !== "remote" && !job.remote) {
        return false;
      }

      if (sidebarFilters.contract && job.type !== "contract") {
        return false;
      }

      if (sidebarFilters.minSalary > 0 && salary > 0 && salary < sidebarFilters.minSalary) {
        return false;
      }

      if (
        sidebarFilters.skills.length > 0 &&
        !sidebarFilters.skills.some((skill) => skills.includes(skill.toLowerCase()))
      ) {
        return false;
      }

      return true;
    });
  }, [jobs, sidebarFilters]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar
          filterState={sidebarFilters}
          onApplyFilters={setSidebarFilters}
          onResetFilters={() => setSidebarFilters(initialSidebarFilters)}
          salaryRangeMax={salaryRangeMax}
        />
        <div className="flex-1 md:ml-64 p-6">
          <SearchBar onSearch={fetchJobs} loading={loading} />

          <div className="mt-8 mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Recommended Jobs</h2>
            <p className="text-sm text-gray-500">
              {filteredJobs.length} result{filteredJobs.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                Loading jobs...
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
                No jobs matched your search. Try changing keyword, location, type, work mode, skill, or sidebar filters.
              </div>
            ) : (
              filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
