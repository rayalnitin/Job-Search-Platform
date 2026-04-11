export default function RequestsList() {
  const requests = [
    { name: "Ankit Jain", role: "ML Engineer" },
  ];

  return (
    <div className="space-y-4">

      {requests.map((r, i) => (
        <div key={i} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">

          <div>
            <h3 className="font-semibold">{r.name}</h3>
            <p className="text-gray-500 text-sm">{r.role}</p>
          </div>

          <div className="flex gap-2">
            <button className="bg-green-500 text-white px-3 py-1 rounded">
              Accept
            </button>
            <button className="bg-red-500 text-white px-3 py-1 rounded">
              Reject
            </button>
          </div>

        </div>
      ))}

    </div>
  );
}