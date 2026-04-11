import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const role = localStorage.getItem("role") || "user";

  const menuItems = {
    user: [
      { name: "Jobs", path: "/dashboard" },
      { name: "Networking", path: "/network" },
      { name: "Messages", path: "/messages" },
      { name: "Applications", path: "/applications" },
    ],
    recruiter: [
      { name: "Dashboard", path: "/recruiter/dashboard" },
      { name: "Job Posts", path: "/recruiter/jobs" },
      { name: "Applicants", path: "/recruiter/applicants" },
      { name: "Messages", path: "/recruiter/messages" },
      { name: "Company Profile", path: "/recruiter/company" },
    ],
  };

  const active = (path) =>
    location.pathname === path ||
    (path === "/dashboard" && location.pathname === "/apply")
      ? "text-blue-700 border-b-2 border-blue-700 pb-1"
      : "text-gray-500 hover:text-blue-600";

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const items = menuItems[role] || menuItems.user;

  return (
    <div className="fixed top-0 w-full z-50 backdrop-blur-lg bg-white/80 shadow px-6 py-3 flex justify-between items-center">
      <div className="flex gap-6 items-center min-w-0">
        <Link to={role === "recruiter" ? "/recruiter/dashboard" : "/dashboard"}>
          <h1 className="font-bold text-blue-800 text-lg cursor-pointer whitespace-nowrap">
            Nexus Professional
          </h1>
        </Link>

        <div className="hidden lg:flex gap-6 text-sm font-semibold min-w-0">
          {items.map((item) => (
            <Link key={item.path} to={item.path} className={active(item.path)}>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-4 items-center relative shrink-0">
        <span className="cursor-pointer">Bell</span>
        <span className="cursor-pointer">Settings</span>

        <div
          onClick={() => setOpen(!open)}
          className="w-8 h-8 bg-gray-300 rounded-full cursor-pointer"
        />

        {open && (
          <div className="absolute right-0 top-12 bg-white shadow rounded w-44">
            <Link
              to={role === "recruiter" ? "/recruiter/profile" : "/profile"}
              className="block px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>

            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
