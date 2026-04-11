export default function RightPanel({ selectedUser }) {
  if (!selectedUser) return null;

  return (
    <div className="hidden w-72 border-l bg-white p-4 xl:block">
      <h3 className="mb-4 font-bold">Contact Info</h3>
      <p className="text-sm font-semibold text-gray-800">
        {selectedUser.name || "User"}
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {selectedUser.email || "Direct conversation"}
      </p>
      <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-3">
        <p className="text-xs text-blue-700">
          Secure chat enabled for recruiter and candidate communication.
        </p>
      </div>
    </div>
  );
}