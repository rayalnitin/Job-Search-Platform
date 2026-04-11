export default function ApplicationCard({ app }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">

      <h3 className="font-bold text-lg">{app.title}</h3>

      <p className="text-gray-500 text-sm">
        {app.company}
      </p>

      <div className="mt-4 flex justify-between items-center">

        <span className="text-xs text-gray-400">
          Applied {app.date}
        </span>

        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
          {app.status}
        </span>

      </div>
    </div>
  );
}