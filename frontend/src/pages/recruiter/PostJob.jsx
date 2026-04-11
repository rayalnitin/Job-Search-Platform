import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import { createJob, updateJob } from "../../api/company";

const initialForm = {
  title: "",
  description: "",
  skills: "",
  location: "",
  type: "full-time",
  locationType: "onsite",
  salaryRange: "",
  deadline: "",
};

export default function PostJob() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingJob = location.state?.job || null;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!editingJob) {
      return;
    }

    setForm({
      title: editingJob.title || "",
      description: editingJob.description || "",
      skills: Array.isArray(editingJob.skills) ? editingJob.skills.join(", ") : "",
      location: editingJob.location || "",
      type: editingJob.type || "full-time",
      locationType: editingJob.locationType || "onsite",
      salaryRange: editingJob.salaryRange || "",
      deadline: editingJob.deadline
        ? new Date(editingJob.deadline).toISOString().slice(0, 10)
        : "",
    });
  }, [editingJob]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      const companyId = localStorage.getItem("companyId");
      if (!companyId) {
        setMessage("Create your company profile before posting jobs.");
        return;
      }

      setLoading(true);
      setMessage("");

      const payload = {
        title: form.title,
        description: form.description,
        skills: form.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        location: form.location,
        type: form.type,
        locationType: form.locationType,
        salaryRange: form.salaryRange,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };

      if (editingJob?.id) {
        await updateJob(editingJob.id, payload);
        setMessage("Job updated successfully.");
      } else {
        await createJob(companyId, payload);
        setMessage("Job posted successfully.");
      }

      navigate("/recruiter/jobs");
    } catch (err) {
      console.log("Post job error:", err?.response?.data || err);
      setMessage(err?.response?.data?.message || "Failed to save job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="pt-20 flex">
        <RecruiterSidebar />
        <div className="flex-1 p-8 max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            {editingJob ? "Edit Job" : "Create New Job"}
          </h1>
          <p className="text-gray-500 mb-8">
            Build a clear job post that candidates can discover and apply to.
          </p>

          {message && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold mb-4">Core Details</h2>
              <input
                name="title"
                placeholder="Job Title"
                value={form.title}
                onChange={handleChange}
                className="w-full p-3 border rounded mb-4"
              />
              <textarea
                name="description"
                placeholder="Job Description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 border rounded"
                rows={6}
              />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold mb-4">Requirements</h2>
              <input
                name="skills"
                placeholder="Skills (comma separated)"
                value={form.skills}
                onChange={handleChange}
                className="w-full p-3 border rounded mb-4"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="location"
                  placeholder="Location"
                  value={form.location}
                  onChange={handleChange}
                  className="p-3 border rounded"
                />

                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="p-3 border rounded"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </select>

                <select
                  name="locationType"
                  value={form.locationType}
                  onChange={handleChange}
                  className="p-3 border rounded"
                >
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold mb-4">Salary & Deadline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="salaryRange"
                  placeholder="Salary range"
                  value={form.salaryRange}
                  onChange={handleChange}
                  className="p-3 border rounded"
                />

                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="p-3 border rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => navigate("/recruiter/jobs")}
                className="px-6 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
              >
                {loading ? "Saving..." : editingJob ? "Update Job" : "Post Job"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}