import Navbar from "../../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import { createCompany, getCompanies, getCompany, updateCompany } from "../../api/company";

function getCurrentUserId() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1])).sub;
  } catch {
    return null;
  }
}

const emptyCompany = {
  name: "",
  description: "",
  location: "",
  website: "",
};

export default function CompanyProfile() {
  const [company, setCompany] = useState(emptyCompany);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const companyId = localStorage.getItem("companyId");

        if (companyId && companyId !== "undefined") {
          const res = await getCompany(companyId);
          setCompany(res.data);
          return;
        }

        const res = await getCompanies();
        const userId = getCurrentUserId();
        const myCompany = res.data.find((c) => c.createdBy?.id === userId);

        if (myCompany) {
          setCompany(myCompany);
          localStorage.setItem("companyId", myCompany.id);
          return;
        }

        setCompany(emptyCompany);
        setEdit(true);
      } catch (err) {
        console.log("Fetch company error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  const handleChange = (e) => {
    setCompany((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      const companyId = localStorage.getItem("companyId");
      const payload = {
        name: company.name,
        description: company.description,
        location: company.location,
        website: company.website || undefined,
      };

      if (!companyId || companyId === "undefined") {
        const res = await createCompany(payload);
        const newCompany = res.data.company;
        localStorage.setItem("companyId", newCompany.id);
        setCompany(newCompany);
        setMessage("Company created successfully.");
      } else {
        const res = await updateCompany(companyId, payload);
        setCompany(res.data.company || { ...company, ...payload });
        setMessage("Company updated successfully.");
      }

      setEdit(false);
    } catch (err) {
      console.log("Save company error:", err);
      setMessage(err?.response?.data?.message || "Failed to save company.");
    } finally {
      setSaving(false);
    }
  };

  const hasCompanyId = useMemo(
    () => Boolean(localStorage.getItem("companyId")),
    [company?.id]
  );

  if (loading) {
    return <p className="p-8">Loading company...</p>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="pt-20 flex">
        <RecruiterSidebar />
        <div className="flex-1 p-8 max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold">Company Profile</h1>
              <p className="text-gray-500">
                {hasCompanyId
                  ? "Manage your public company identity and employer branding."
                  : "Create your company profile before posting jobs."}
              </p>
            </div>

            <button
              onClick={() => (edit ? setEdit(false) : setEdit(true))}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {edit ? "Cancel" : hasCompanyId ? "Edit" : "Create"}
            </button>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4">Company Snapshot</h3>
              <div className="h-36 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center text-blue-700 font-semibold mb-4">
                {company.name || "Your company"}
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400 uppercase tracking-wide text-xs">Location</p>
                  <p className="mt-1 text-gray-700">{company.location || "Not added"}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase tracking-wide text-xs">Website</p>
                  <p className="mt-1 text-gray-700 break-all">{company.website || "Not added"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">Company Name</label>
                {edit ? (
                  <input
                    name="name"
                    value={company.name || ""}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="mt-2 text-lg font-semibold text-gray-900">{company.name || "Not added"}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Description</label>
                {edit ? (
                  <textarea
                    name="description"
                    value={company.description || ""}
                    onChange={handleChange}
                    rows={6}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">{company.description || "No description added yet."}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Location</label>
                  {edit ? (
                    <input
                      name="location"
                      value={company.location || ""}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="mt-2 text-gray-700">{company.location || "Not added"}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Website</label>
                  {edit ? (
                    <input
                      name="website"
                      value={company.website || ""}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  ) : company.website ? (
                    <a href={company.website} target="_blank" rel="noreferrer" className="mt-2 block text-blue-600 hover:underline break-all">
                      {company.website}
                    </a>
                  ) : (
                    <p className="mt-2 text-gray-700">Not added</p>
                  )}
                </div>
              </div>

              {edit && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : hasCompanyId ? "Save Changes" : "Create Company"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}