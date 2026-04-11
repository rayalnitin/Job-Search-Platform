import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import CompanyHeader from "../../components/company/CompanyHeader";
import CompanyAbout from "../../components/company/CompanyAbout";
import CompanyJobs from "../../components/company/CompanyJobs";
import { getCompanies, getCompany } from "../../api/company";

export default function Company() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await getCompanies();
        setCompanies(res.data);

        if (id) {
          const detailRes = await getCompany(id);
          setSelectedCompany(detailRes.data);
        } else if (res.data.length > 0) {
          setSelectedCompany(res.data[0]);
        }
      } catch (err) {
        console.log("Fetch companies error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [id]);

  const companyList = useMemo(
    () => companies.sort((a, b) => a.name.localeCompare(b.name)),
    [companies]
  );

  if (loading) {
    return <div className="p-10 text-center">Loading companies...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-gray-500 mt-2">
              Explore companies, open roles, and jump back into the application flow.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm h-fit">
              <h2 className="text-lg font-semibold text-gray-900">Browse Companies</h2>
              <div className="mt-4 space-y-3">
                {companyList.length === 0 ? (
                  <p className="text-sm text-gray-500">No companies available yet.</p>
                ) : (
                  companyList.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        setSelectedCompany(company);
                        navigate(`/company/${company.id}`);
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedCompany?.id === company.id
                          ? "border-blue-100 bg-blue-50"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{company.name}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {company.location || "Location not added"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section>
              {selectedCompany ? (
                <>
                  <CompanyHeader company={selectedCompany} />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
                    <div className="lg:col-span-4">
                      <CompanyAbout company={selectedCompany} />
                    </div>
                    <div className="lg:col-span-8">
                      <CompanyJobs jobs={selectedCompany.jobs || []} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm text-sm text-gray-500">
                  Select a company to view its details and open positions.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}