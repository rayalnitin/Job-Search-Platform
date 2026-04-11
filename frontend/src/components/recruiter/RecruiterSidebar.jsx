import { Link, useLocation } from "react-router-dom";

export default function RecruiterSidebar() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
      ? "bg-blue-100 text-blue-700"
      : "hover:bg-gray-100";

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="hidden md:flex w-64 bg-white border-r h-screen p-4 flex-col">
      <h2 className="font-bold text-blue-800 mb-6">Recruiter Panel</h2>

      <div className="space-y-2">
        <Link to="/recruiter/dashboard">
          <p className={`p-2 rounded ${isActive("/recruiter/dashboard")}`}>
            Dashboard
          </p>
        </Link>

        <Link to="/recruiter/jobs">
          <p className={`p-2 rounded ${isActive("/recruiter/jobs")}`}>
            Job Posts
          </p>
        </Link>

        <Link to="/recruiter/applicants">
          <p className={`p-2 rounded ${isActive("/recruiter/applicants")}`}>
            Applicants
          </p>
        </Link>

        <Link to="/recruiter/company">
          <p className={`p-2 rounded ${isActive("/recruiter/company")}`}>
            Company Profile
          </p>
        </Link>

        <Link to="/recruiter/messages">
          <p className={`p-2 rounded ${isActive("/recruiter/messages")}`}>
            Messages
          </p>
        </Link>

        <Link to="/recruiter/profile">
          <p className={`p-2 rounded ${isActive("/recruiter/profile")}`}>
            Recruiter Profile
          </p>
        </Link>
      </div>

      <Link to="/recruiter/post-job">
        <button className="mt-6 bg-blue-600 text-white py-2 rounded w-full">
          + Post Job
        </button>
      </Link>

      <div className="mt-auto pt-6">
        <button onClick={handleLogout} className="text-red-500">
          Logout
        </button>
      </div>
    </div>
  );
}