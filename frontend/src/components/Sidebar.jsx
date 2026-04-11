import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const showFilters = pathname === "/dashboard" || pathname === "/apply";

  const active = (path) =>
    pathname === path || (path === "/dashboard" && pathname === "/apply")
      ? "p-2 bg-blue-100 text-blue-700 rounded"
      : "p-2 hover:bg-gray-200 rounded";

  return (
    <div className="hidden md:flex fixed left-0 top-0 pt-20 w-64 h-full bg-gray-50 border-r p-4 flex-col">
      <h2 className="font-bold text-blue-800 mb-6">Management</h2>

      <div className="space-y-2 mb-4">
        <Link to="/dashboard" className={active("/dashboard")}>
          Dashboard
        </Link>
        <Link to="/applications" className={active("/applications")}>
          Applications
        </Link>
      </div>

      <div className="space-y-2 mb-6 text-sm">
        {/* <Link to="/profile" className={active("/profile")}>
          Profile
        </Link>
        <Link to="/resume" className={active("/resume")}>
          Resume
        </Link>
        <Link to="/messages" className={active("/messages")}>
          Messages
        </Link> */}
        {/* <Link to="/company" className={active("/company")}>
          Companies
        </Link>
        <Link to="/network" className={active("/network")}>
          Networking
        </Link> */}
      </div>

      {showFilters && (
        <>
          <hr className="my-4" />
          <h3 className="text-sm font-semibold mb-3">Filters</h3>

          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span>Full-time</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span>Remote</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              <span>Contract</span>
            </label>
          </div>

          <div className="mt-6">
            <input type="range" className="w-full" defaultValue="45" />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="bg-blue-100 px-2 py-1 rounded">React</span>
            <span className="bg-blue-100 px-2 py-1 rounded">Python</span>
          </div>
        </>
      )}
    </div>
  );
}
