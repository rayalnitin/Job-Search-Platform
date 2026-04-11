import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/user";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

export default function Profile() {
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    headline: "",
    location: "",
    bio: "",
    education: "",
    experience: "",
    skills: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile({
          name: res.data.name || "",
          headline: res.data.headline || "",
          location: res.data.location || "",
          bio: res.data.bio || "",
          education: res.data.education || "",
          experience: res.data.experience || "",
          skills: res.data.skills || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
        });
      } catch (err) {
        console.log("Fetch profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
        education: profile.education,
        experience: profile.experience,
        skills: profile.skills,
      });
      setEdit(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.log("Update profile error:", err);
      setMessage(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8">Loading profile...</p>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-6 max-w-5xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-bold">
                {(profile.name || "U").charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                {edit ? (
                  <div className="space-y-3">
                    <input name="name" value={profile.name} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Full name" />
                    <input name="headline" value={profile.headline} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Professional headline" />
                    <input name="location" value={profile.location} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Location" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900">{profile.name || "Your Profile"}</h2>
                    <p className="mt-1 text-gray-500">{profile.headline || "Add your professional headline"}</p>
                    <p className="mt-1 text-sm text-gray-400">{profile.location || "Location not added"}</p>
                  </>
                )}
              </div>

              <button
                onClick={edit ? handleSave : () => setEdit(true)}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {edit ? (saving ? "Saving..." : "Save") : "Edit"}
              </button>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900">Bio</h3>
                {edit ? (
                  <textarea name="bio" value={profile.bio} onChange={handleChange} rows={5} className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                ) : (
                  <p className="mt-3 text-gray-600 whitespace-pre-wrap">{profile.bio || "Tell recruiters about your background and goals."}</p>
                )}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900">Education</h3>
                {edit ? (
                  <textarea name="education" value={profile.education} onChange={handleChange} rows={3} className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                ) : (
                  <p className="mt-3 text-gray-600 whitespace-pre-wrap">{profile.education || "Add your education history."}</p>
                )}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900">Experience</h3>
                {edit ? (
                  <textarea name="experience" value={profile.experience} onChange={handleChange} rows={4} className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" />
                ) : (
                  <p className="mt-3 text-gray-600 whitespace-pre-wrap">{profile.experience || "Add your work experience."}</p>
                )}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900">Skills</h3>
                {edit ? (
                  <textarea name="skills" value={profile.skills} onChange={handleChange} rows={3} className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="React, Node.js, Python" />
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(profile.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean).length > 0 ? (
                      (profile.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean).map((skill) => (
                        <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-600">Add your key skills.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-900">Contact</h3>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                  <p className="mt-1 text-gray-800 break-all">{profile.email || "Not available"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="mt-1 text-gray-800">{profile.phone || "Not available"}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                  Email and phone come from your account record. Edit the professional fields here to improve what recruiters see.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}