export default function ConnectionsList() {
  const connections = [
    { name: "Rohit Kumar", role: "Backend Engineer" },
    { name: "Sneha Patel", role: "UI Designer" },
  ];

  return (
    <div className="space-y-4">

      {connections.map((c, i) => (
        <div key={i} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">

          <div>
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-gray-500 text-sm">{c.role}</p>
          </div>

          <button className="bg-blue-600 text-white px-4 py-1 rounded">
            Message
          </button>

        </div>
      ))}

    </div>
  );
}