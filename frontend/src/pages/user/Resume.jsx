import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import {
  deleteResume,
  downloadResume,
  getResumes,
  setActiveResume,
  uploadResume,
} from "../../api/resume";

export default function Resume() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchResumes = async () => {
    try {
      const res = await getResumes();
      setResumes(res.data);
    } catch (err) {
      console.log("Fetch resumes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);
      await uploadResume(formData);
      setMessage("Resume uploaded successfully.");
      await fetchResumes();
    } catch (err) {
      console.log("Upload resume error:", err);
      setMessage(err?.response?.data?.message || "Failed to upload resume.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((resume) => resume.id !== id));
    } catch (err) {
      console.log("Delete resume error:", err);
      setMessage(err?.response?.data?.message || "Failed to delete resume.");
    }
  };

  const handleSetActive = async (id) => {
    try {
      await setActiveResume(id);
      setResumes((prev) =>
        prev.map((resume) => ({ ...resume, isActive: resume.id === id }))
      );
    } catch (err) {
      console.log("Set active resume error:", err);
      setMessage(err?.response?.data?.message || "Failed to set active resume.");
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const res = await downloadResume(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log("Download resume error:", err);
      setMessage(err?.response?.data?.message || "Failed to download resume.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-6 max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Resume Vault</h1>
              <p className="text-gray-500">Manage your uploaded resumes and choose which one stays active.</p>
            </div>

            <label className="rounded-2xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 cursor-pointer">
              {uploading ? "Uploading..." : "Upload Resume"}
              <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
              Loading resumes...
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
              No resumes uploaded yet. Add a PDF or DOCX resume to use during job applications.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {resumes.map((resume) => (
                <div key={resume.id} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 break-all">{resume.filename}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {resume.isActive && (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {!resume.isActive && (
                      <button onClick={() => handleSetActive(resume.id)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        Set Active
                      </button>
                    )}
                    <button onClick={() => handleDownload(resume.id, resume.filename)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      Download
                    </button>
                    <button onClick={() => handleDelete(resume.id)} className="rounded-xl px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50">
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