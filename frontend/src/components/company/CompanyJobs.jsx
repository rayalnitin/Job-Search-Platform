import JobCard from "../JobCard";

export default function CompanyJobs({ jobs }) {
  return (
    <div className="space-y-4">

      <h2 className="text-xl font-bold">
        Open Positions
      </h2>

      {(!jobs || jobs.length === 0) && (
        <p className="text-gray-500">
          No jobs available
        </p>
      )}

      {jobs?.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

    </div>
  );
}