import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import OtpVirtualKeyboard from "../../components/OtpVirtualKeyboard";
import {
  deleteResume,
  downloadResume,
  getResumes,
  requestResumeDownloadOtp,
  setActiveResume,
  uploadResume,
} from "../../api/resume";

export default function Resume() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [otpInputs, setOtpInputs] = useState({});
  const [otpRequested, setOtpRequested] = useState({});
  const [downloadUnlocked, setDownloadUnlocked] = useState({});

  const fetchResumes = async () => {
    try {
      const res = await getResumes();
      setResumes(res.data);
    } catch (err) {
      console.log("Fetch resumes error:", err);
      setMessage("Failed to load resumes.");
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
      setMessage("Resume deleted successfully.");
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
      setMessage("Active resume updated successfully.");
    } catch (err) {
      console.log("Set active resume error:", err);
      setMessage(err?.response?.data?.message || "Failed to set active resume.");
    }
  };

  const handleRequestOtp = async (id) => {
    try {
      await requestResumeDownloadOtp(id);
      setOtpRequested((prev) => ({ ...prev, [id]: true }));
      setDownloadUnlocked((prev) => ({ ...prev, [id]: false }));
      setOtpInputs((prev) => ({ ...prev, [id]: "" }));
      setMessage("OTP sent to your email. Enter it with the virtual keypad below.");
    } catch (err) {
      console.log("Request OTP error:", err);
      setMessage(err?.response?.data?.message || "Failed to request download OTP.");
    }
  };

  const handleDownload = async (resume) => {
    const otpCode = otpInputs[resume.id]?.trim();

    if (!otpCode) {
      setMessage("Enter the OTP before downloading your resume.");
      return;
    }

    try {
      const res = await downloadResume(resume.id, otpCode);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = resume.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage(
        res.headers["x-integrity-note"] || "Resume downloaded successfully."
      );
      setDownloadUnlocked((prev) => ({ ...prev, [resume.id]: true }));
      setOtpInputs((prev) => ({ ...prev, [resume.id]: "" }));
      setOtpRequested((prev) => ({ ...prev, [resume.id]: false }));
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
              <p className="text-gray-500">
                Manage encrypted resumes, switch the active version, and use OTP to download securely.
              </p>
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

                  <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-xs text-gray-500 space-y-2">
                    <p>
                      <span className="font-semibold text-gray-700">Integrity Hash:</span>{" "}
                      <span className="break-all">{resume.fileHash || "Not available"}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">PKI Signature:</span>{" "}
                      {resume.hasPkiSignature ? "Present" : "Not available"}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <button
                      onClick={() => handleRequestOtp(resume.id)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-200 hover:bg-blue-50"
                    >
                      {otpRequested[resume.id] ? "Resend Download OTP" : "Request Download OTP"}
                    </button>

                    {otpRequested[resume.id] && !downloadUnlocked[resume.id] && (
                      <OtpVirtualKeyboard
                        value={otpInputs[resume.id] || ""}
                        onChange={(code) =>
                          setOtpInputs((prev) => ({ ...prev, [resume.id]: code }))
                        }
                        length={6}
                        title="Resume download OTP"
                        hint="Use the virtual keypad to enter the 6-digit code sent to your email."
                        submitLabel="Download Resume"
                        onSubmit={() => handleDownload(resume)}
                      />
                    )}

                    {downloadUnlocked[resume.id] && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        OTP verified. Resume downloaded securely.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {!resume.isActive && (
                      <button onClick={() => handleSetActive(resume.id)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(resume)}
                      disabled={!otpInputs[resume.id] || otpInputs[resume.id].trim().length !== 6}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        otpInputs[resume.id] && otpInputs[resume.id].trim().length === 6
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                      }`}
                    >
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
