import { useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import UserCard from "../../components/network/UserCard";
import ConnectionsList from "../../components/network/ConnectionsList";
import RequestsList from "../../components/network/RequestsList";

const users = [
  { name: "Amit Sharma", role: "Software Engineer", company: "Nexus Labs" },
  { name: "Neha Singh", role: "Product Manager", company: "BlueOrbit" },
  { name: "Rahul Verma", role: "Data Scientist", company: "DataNest" },
  { name: "Priya Nair", role: "Frontend Developer", company: "PixelForge" },
];

export default function Networking() {
  const [tab, setTab] = useState("suggestions");

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <div className="flex-1 md:ml-64 px-6 py-8 max-w-7xl">
          <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">Build Your Network</h1>
            <p className="mt-2 text-gray-500">
              This section is still static for now, but the UI is ready for future connection and networking APIs.
            </p>
          </div>

          <div className="mt-8 flex gap-3 border-b border-gray-200 pb-3">
            {["suggestions", "connections", "requests"].map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                  tab === item
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "suggestions" && (
            <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              {users.map((user) => (
                <div key={user.name} className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
                  <UserCard user={user} />
                  <p className="mt-2 text-xs text-gray-400">{user.company}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "connections" && (
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <ConnectionsList />
            </div>
          )}

          {tab === "requests" && (
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <RequestsList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}