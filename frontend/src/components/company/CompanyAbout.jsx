export default function CompanyAbout({ company }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <h2 className="font-bold mb-3">
        About Us
      </h2>

      <p className="text-gray-500 text-sm">
        {company.description || "No description available"}
      </p>

    </div>
  );
}