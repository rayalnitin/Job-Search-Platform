import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3 shadow-sm backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Admin Console
        </p>
        <h1 className="text-lg font-bold text-slate-900">Nexus Professional</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{user.email || "Admin"}</p>
          <p className="text-xs text-slate-500">Platform administrator</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
