import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import {
  deleteAvatar,
  getAvatarUrl,
  getProfile,
  getProfileViewers,
  getUserProfileById,
  updateProfile,
  uploadAvatar,
} from "../../api/user";

const privacyOptions = [
  { value: "public", label: "Public" },
  { value: "connections", label: "Connections" },
  { value: "private", label: "Private" },
];

const privacyFields = [
  { key: "headlinePrivacy", label: "Headline" },
  { key: "locationPrivacy", label: "Location" },
  { key: "bioPrivacy", label: "Bio" },
  { key: "educationPrivacy", label: "Education" },
  { key: "experiencePrivacy", label: "Experience" },
  { key: "skillsPrivacy", label: "Skills" },
];

const emptyProfile = {
  id: "",
  name: "",
  headline: "",
  location: "",
  bio: "",
  education: "",
  experience: "",
  skills: "",
  email: "",
  phone: "",
  role: "",
  hasAvatar: false,
  privacy: {
    headlinePrivacy: "public",
    locationPrivacy: "public",
    bioPrivacy: "public",
    educationPrivacy: "public",
    experiencePrivacy: "public",
    skillsPrivacy: "public",
    optOutOfViewers: false,
  },
};

export default function Profile() {
  const navigate = useNavigate();
  const { id: profileId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id;
  const isOwnProfile = !profileId || profileId === currentUserId;
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [viewers, setViewers] = useState({
    totalUniqueViewers: 0,
    recentViewers: [],
  });
  const fileInputRef = useRef(null);

  const showViewersCard = isOwnProfile;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRequest = isOwnProfile && profileId
          ? getProfile()
          : isOwnProfile
            ? getProfile()
            : getUserProfileById(profileId);

        const profileRes = await profileRequest;
        const viewersRes = isOwnProfile ? await getProfileViewers() : null;

        setProfile({
          id: profileRes.data.id || "",
          name: profileRes.data.name || "",
          headline: profileRes.data.headline || "",
          location: profileRes.data.location || "",
          bio: profileRes.data.bio || "",
          education: profileRes.data.education || "",
          experience: profileRes.data.experience || "",
          skills: profileRes.data.skills || "",
          email: profileRes.data.email || "",
          phone: profileRes.data.phone || "",
          role: profileRes.data.role || "",
          hasAvatar: profileRes.data.hasAvatar || false,
          privacy: {
            headlinePrivacy: profileRes.data.privacy?.headlinePrivacy || "public",
            locationPrivacy: profileRes.data.privacy?.locationPrivacy || "public",
            bioPrivacy: profileRes.data.privacy?.bioPrivacy || "public",
            educationPrivacy: profileRes.data.privacy?.educationPrivacy || "public",
            experiencePrivacy: profileRes.data.privacy?.experiencePrivacy || "public",
            skillsPrivacy: profileRes.data.privacy?.skillsPrivacy || "public",
            optOutOfViewers: profileRes.data.privacy?.optOutOfViewers || false,
          },
        });
        setViewers(
          viewersRes?.data || {
            totalUniqueViewers: 0,
            recentViewers: [],
          }
        );
      } catch (err) {
        console.log("Fetch profile error:", err);
        setMessage("Unable to load profile right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    setEdit(false);
  }, [isOwnProfile, profileId]);

  const avatarUrl = useMemo(() => {
    if (!profile.id || !profile.hasAvatar) {
      return "";
    }

    return `${getAvatarUrl(profile.id)}?v=${Date.now()}`;
  }, [profile.hasAvatar, profile.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name in profile.privacy) {
      setProfile((prev) => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          [name]: type === "checkbox" ? checked : value,
        },
      }));
      return;
    }

    setProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!isOwnProfile) {
      return;
    }

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
        ...profile.privacy,
      });

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          name: profile.name,
        })
      );
      localStorage.setItem("name", profile.name);

      setEdit(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.log("Update profile error:", err);
      setMessage(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await uploadAvatar(formData);
      setProfile((prev) => ({ ...prev, hasAvatar: true }));
      setMessage("Avatar uploaded successfully.");
    } catch (err) {
      console.log("Upload avatar error:", err);
      setMessage(err?.response?.data?.message || "Failed to upload avatar.");
    } finally {
      event.target.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await deleteAvatar();
      setProfile((prev) => ({ ...prev, hasAvatar: false }));
      setMessage("Avatar deleted successfully.");
    } catch (err) {
      console.log("Delete avatar error:", err);
      setMessage(err?.response?.data?.message || "Failed to delete avatar.");
    }
  };

  const handleCopyUuid = async () => {
    try {
      await navigator.clipboard.writeText(profile.id);
      setMessage("Your UUID has been copied. Share it so others can send you a connection request.");
    } catch (err) {
      console.log(err);
      setMessage("Unable to copy UUID automatically. You can still copy it manually.");
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
        <div className="flex-1 md:ml-64 p-6 max-w-6xl">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                {profile.hasAvatar ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name || "Profile avatar"}
                    className="h-24 w-24 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-bold">
                    {(profile.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    {edit && isOwnProfile ? (
                      <input
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="w-full max-w-md rounded-2xl border border-gray-200 px-4 py-2 text-2xl font-bold text-gray-900 outline-none focus:border-blue-500"
                        placeholder="Your full name"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-900">{profile.name || "Your Profile"}</h2>
                    )}
                    <p className="mt-1 text-gray-500">{profile.headline || "Add your professional headline"}</p>
                    <p className="mt-1 text-sm text-gray-400">{profile.location || "Location not added"}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {isOwnProfile ? (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {profile.hasAvatar ? "Change Avatar" : "Upload Avatar"}
                        </button>
                        {profile.hasAvatar && (
                          <button
                            type="button"
                            onClick={handleAvatarDelete}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                          >
                            Remove Avatar
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/messages", {
                            state: {
                              selectedUser: {
                                id: profile.id,
                                userId: profile.id,
                                email: profile.email,
                                name: profile.name || profile.email,
                              },
                            },
                          })
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Message
                      </button>
                    )}
                  </div>
                  {isOwnProfile && (
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  )}
                </div>
              </div>

              <div className="lg:ml-auto">
                {isOwnProfile ? (
                  <button
                    onClick={edit ? handleSave : () => setEdit(true)}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    {edit ? (saving ? "Saving..." : "Save") : "Edit"}
                  </button>
                ) : (
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Viewing this profile counts as a unique view for the owner.
                  </div>
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
            <div className="space-y-6">
              {[
                ["Bio", "bio", 5, "Tell recruiters about your background and goals."],
                ["Education", "education", 3, "Add your education history."],
                ["Experience", "experience", 4, "Add your work experience."],
              ].map(([title, field, rows, fallback]) => (
                <div key={field} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900">{title}</h3>
                  {edit ? (
                    <textarea
                      name={field}
                      value={profile[field]}
                      onChange={handleChange}
                      rows={rows}
                      className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-3 text-gray-600 whitespace-pre-wrap">{profile[field] || fallback}</p>
                  )}
                </div>
              ))}

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900">Skills</h3>
                {edit ? (
                  <textarea
                    name="skills"
                    value={profile.skills}
                    onChange={handleChange}
                    rows={3}
                    className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="React, Node.js, Python"
                  />
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(profile.skills || "")
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean).length > 0 ? (
                      (profile.skills || "")
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                        .map((skill) => (
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

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900">Privacy Controls</h3>
                <p className="mt-1 text-sm text-gray-500">Control which profile fields are visible to others.</p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {privacyFields.map((field) => (
                    <div key={field.key}>
                      <p className="text-sm font-semibold text-gray-700">{field.label}</p>
                      {edit ? (
                        <select
                          name={field.key}
                          value={profile.privacy[field.key]}
                          onChange={handleChange}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                          {privacyOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="mt-2 text-sm capitalize text-gray-600">{profile.privacy[field.key]}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 px-4 py-3">
                  <label className="flex items-start gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="optOutOfViewers"
                      checked={profile.privacy.optOutOfViewers}
                      onChange={handleChange}
                      disabled={!edit}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <span>
                      <span className="font-semibold">Opt out of viewer tracking</span>
                      <span className="block mt-1 text-xs text-gray-500">If enabled, your visits to other profiles will never be recorded.</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
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
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Role</p>
                    <p className="mt-1 text-gray-800 capitalize">{profile.role || "user"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900">Your UUID</h3>
                  <button
                    type="button"
                    onClick={handleCopyUuid}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Share this UUID when someone wants to send you a connection request.
                </p>
                <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-xs text-gray-700 break-all">
                  {profile.id}
                </div>
              </div>

              {showViewersCard ? (
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900">Profile Viewers</h3>
                      <p className="mt-1 text-sm text-gray-500">Unique visits within the last hour are deduplicated.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Live</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-blue-700">{viewers.totalUniqueViewers || 0}</p>
                  <p className="mt-1 text-sm text-gray-500">unique viewers</p>

                  <div className="mt-5 space-y-3">
                    {viewers.recentViewers?.length ? (
                      viewers.recentViewers.map((viewer) => (
                        <div key={`${viewer.viewerId}-${viewer.viewedAt}`} className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-sm font-medium text-gray-800 break-all">{viewer.viewerEmail}</p>
                          <p className="mt-1 text-xs text-gray-500">Viewed {new Date(viewer.viewedAt).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No recent viewers yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900">Profile View</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    This open is counted automatically and can be used from messages, networking, or applicant cards.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
