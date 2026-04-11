import { useState } from "react";

export default function UserCard({ user }) {
  const [connected, setConnected] = useState(false);

  return (
    <div className="bg-white p-5 rounded-xl shadow text-center">

      <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3"></div>

      <h3 className="font-bold">{user.name}</h3>
      <p className="text-gray-500 text-sm">{user.role}</p>

      <button
        onClick={() => setConnected(true)}
        className={`mt-4 w-full py-2 rounded ${
          connected
            ? "bg-gray-300"
            : "bg-blue-600 text-white"
        }`}
      >
        {connected ? "Connected" : "Connect"}
      </button>

    </div>
  );
}