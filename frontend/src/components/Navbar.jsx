import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

function IconBell() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a3 3 0 006 0" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.7a1 1 0 011.4-.4l.6.3a1 1 0 001 0l.6-.3a1 1 0 011.4.4l.4.6a1 1 0 00.8.5l.7.1a1 1 0 01.8 1.1l-.1.7a1 1 0 00.3.9l.5.5a1 1 0 010 1.4l-.5.5a1 1 0 00-.3.9l.1.7a1 1 0 01-.8 1.1l-.7.1a1 1 0 00-.8.5l-.4.6a1 1 0 01-1.4.4l-.6-.3a1 1 0 00-1 0l-.6.3a1 1 0 01-1.4-.4l-.4-.6a1 1 0 00-.8-.5l-.7-.1a1 1 0 01-.8-1.1l.1-.7a1 1 0 00-.3-.9l-.5-.5a1 1 0 010-1.4l.5-.5a1 1 0 00.3-.9l-.1-.7a1 1 0 01.8-1.1l.7-.1a1 1 0 00.8-.5l.4-.6z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const role = localStorage.getItem("role") || "user";
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

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

  const items = menuItems[role] || menuItems.user;

  const active = (path) =>
    location.pathname === path ||
    (path === "/dashboard" && location.pathname === "/apply")
      ? "text-blue-700 border-b-2 border-blue-700 pb-1"
      : "text-gray-500 hover:text-blue-600";

  const initials = useMemo(() => {
    const source = storedUser?.email || storedUser?.name || "U";
    return source.charAt(0).toUpperCase();
  }, [storedUser?.email, storedUser?.name]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="fixed top-0 z-50 flex w-full items-center justify-between bg-white/85 px-6 py-3 shadow backdrop-blur-lg">
      <div className="flex min-w-0 items-center gap-6">
        <Link to={role === "recruiter" ? "/recruiter/dashboard" : "/dashboard"}>
          <h1 className="cursor-pointer whitespace-nowrap text-lg font-bold text-blue-800">
            Nexus Professional
          </h1>
        </Link>

        <div className="hidden lg:flex min-w-0 gap-6 text-sm font-semibold">
          {items.map((item) => (
            <Link key={item.path} to={item.path} className={active(item.path)}>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-3">
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-blue-50 hover:text-blue-700">
          <IconBell />
        </button>
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-blue-50 hover:text-blue-700">
          <IconSettings />
        </button>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-gray-200 text-sm font-bold text-blue-700"
        >
          {initials}
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            <Link
              to={role === "recruiter" ? "/recruiter/profile" : "/profile"}
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={logout}
              className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
