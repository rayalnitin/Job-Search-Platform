import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import CompanyHeader from "../../components/company/CompanyHeader";
import CompanyAbout from "../../components/company/CompanyAbout";
import CompanyJobs from "../../components/company/CompanyJobs";
import { getCompany } from "../../api/company";

export default function Company() {
  const { id } = useParams();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (!id) {
          setSelectedCompany(null);
          return;
        }

        const detailRes = await getCompany(id);
        setSelectedCompany(detailRes.data);
      } catch (err) {
        console.log("Fetch companies error:", err);
        setSelectedCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center">Loading company profile...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Company Profile</h1>
            <p className="text-gray-500 mt-2">
              View the company profile you opened from a job card.
            </p>
          </div>

          {selectedCompany ? (
            <section>
              <CompanyHeader company={selectedCompany} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
                <div className="lg:col-span-4">
                  <CompanyAbout company={selectedCompany} />
                </div>
                <div className="lg:col-span-8">
                  <CompanyJobs jobs={selectedCompany.jobs || []} />
                </div>
              </div>
            </section>
          ) : (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm text-sm text-gray-500">
              Open a company from a job card to see its profile here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}