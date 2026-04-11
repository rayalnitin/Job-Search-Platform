import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import { getProfile, updateProfile } from "../../api/user";
import { getCompany } from "../../api/company";

export default function RecruiterProfile() {
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    headline: "",
    location: "",
    bio: "",
    experience: "",
    skills: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyId = localStorage.getItem("companyId");
        const profileRes = await getProfile();
        let recruiterCompanyName = "";

        if (companyId && companyId !== "undefined") {
          try {
            const companyRes = await getCompany(companyId);
            recruiterCompanyName = companyRes.data.name || "";
          } catch (err) {
            recruiterCompanyName = "";
          }
        }

        setCompanyName(recruiterCompanyName);
        setProfile({
          name: profileRes.data.name || "",
          email: profileRes.data.email || "",
          phone: profileRes.data.phone || "",
          headline: profileRes.data.headline || "",
          location: profileRes.data.location || "",
          bio: profileRes.data.bio || "",
          experience: profileRes.data.experience || "",
          skills: profileRes.data.skills || "",
        });
      } catch (err) {
        console.log("Recruiter profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      await updateProfile({
        name: profile.name,
        headline: profile.headline,
        location: profile.location,
        bio: profile.bio,
        experience: profile.experience,
        skills: profile.skills,
      });
      setEdit(false);
      setMessage("Recruiter profile updated successfully.");
    } catch (err) {
      console.log("Update profile error:", err);
      setMessage(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8">Loading recruiter profile...</p>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="pt-20 flex">
        <RecruiterSidebar />
        <div className="flex-1 max-w-5xl mx-auto p-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">{profile.name || "Recruiter Profile"}</h2>
              <p className="text-gray-500">{companyName || "No company connected yet"}</p>
            </div>

            <button
              onClick={edit ? handleSave : () => setEdit(true)}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {edit ? (saving ? "Saving..." : "Save") : "Edit"}
            </button>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4">Professional Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Full Name</label>
                    {edit ? (
                      <input name="name" value={profile.name} onChange={handleChange} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                    ) : (
                      <p className="mt-2 text-gray-800">{profile.name || "Not added"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Headline</label>
                    {edit ? (
                      <input name="headline" value={profile.headline} onChange={handleChange} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                    ) : (
                      <p className="mt-2 text-gray-800">{profile.headline || "Not added"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Bio</label>
                    {edit ? (
                      <textarea name="bio" value={profile.bio} onChange={handleChange} rows={5} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                    ) : (
                      <p className="mt-2 text-gray-600 whitespace-pre-wrap">{profile.bio || "Not added"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Experience</label>
                    {edit ? (
                      <textarea name="experience" value={profile.experience} onChange={handleChange} rows={4} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                    ) : (
                      <p className="mt-2 text-gray-600 whitespace-pre-wrap">{profile.experience || "Not added"}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Skills</label>
                    {edit ? (
                      <textarea name="skills" value={profile.skills} onChange={handleChange} rows={3} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                    ) : (
                      <p className="mt-2 text-gray-600 whitespace-pre-wrap">{profile.skills || "Not added"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold mb-4">Contact & Location</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400 uppercase tracking-wide text-xs">Email</p>
                  <p className="mt-1 text-gray-800 break-all">{profile.email || "Not available"}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-wide text-xs">Phone</p>
                  <p className="mt-1 text-gray-800">{profile.phone || "Not available"}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-wide text-xs">Location</p>
                  {edit ? (
                    <input name="location" value={profile.location} onChange={handleChange} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                  ) : (
                    <p className="mt-1 text-gray-800">{profile.location || "Not added"}</p>
                  )}
                </div>
                <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                  Email and phone come from your account record. This page edits recruiter profile fields exposed by the backend.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}