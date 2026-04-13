import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import LogsTable from "../../components/admin/LogsTable";
import StatsCards from "../../components/admin/StatsCards";
import {
  deleteUser,
  getAuditLogs,
  getUserById,
  getUsers,
  suspendUser,
  unsuspendUser,
  verifyAuditLogs,
} from "../../api/admin";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState(null);

  const fetchUsers = async (keepSelected = true) => {
    setLoadingUsers(true);
    try {
      const res = await getUsers();
      const nextUsers = res.data || [];
      setUsers(nextUsers);

      setSelectedUserId((current) => {
        if (keepSelected && current && nextUsers.some((user) => user.id === current)) {
          return current;
        }
        return nextUsers[0]?.id || "";
      });
    } catch (err) {
      console.log(err);
      setMessage(err?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getAuditLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.log(err);
      setMessage(err?.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const runAuditVerification = async () => {
    try {
      const res = await verifyAuditLogs();
      setVerification(res.data);
      setMessage(res.data.message);
    } catch (err) {
      console.log(err);
      setMessage(err?.response?.data?.message || "Failed to verify audit logs.");
    }
  };

  useEffect(() => {
    fetchUsers(false);
    fetchLogs();
  }, []);

  useEffect(() => {
    const loadUserDetail = async () => {
      if (!selectedUserId) {
        setSelectedUser(null);
        return;
      }

      setLoadingUserDetail(true);
      try {
        const res = await getUserById(selectedUserId);
        setSelectedUser(res.data);
      } catch (err) {
        console.log(err);
        setMessage(err?.response?.data?.message || "Failed to load user detail.");
      } finally {
        setLoadingUserDetail(false);
      }
    };

    loadUserDetail();
  }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.email, user.phone, user.role].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [search, users]);

  const stats = useMemo(() => {
    const suspendedUsers = users.filter((user) => user.isSuspended).length;
    const verifiedUsers = users.filter((user) => user.isVerified).length;
    const recentLog = logs[0]?.createdAt
      ? new Date(logs[0].createdAt).toLocaleString()
      : "No activity yet";

    return [
      { label: "Total Users", value: users.length, helper: "All roles combined" },
      { label: "Verified Users", value: verifiedUsers, helper: "Can access protected flows" },
      { label: "Suspended Users", value: suspendedUsers, helper: "Currently blocked from login" },
      { label: "Latest Audit Event", value: recentLog, helper: `${logs.length} total log entries` },
    ];
  }, [logs, users]);

  const handleUserAction = async (action) => {
    if (!selectedUserId) {
      return;
    }

    try {
      setMessage("");

      if (action === "suspend") {
        await suspendUser(selectedUserId);
        setMessage("User suspended successfully.");
      }

      if (action === "unsuspend") {
        await unsuspendUser(selectedUserId);
        setMessage("User unsuspended successfully.");
      }

      if (action === "delete") {
        const confirmed = window.confirm("Delete this user permanently?");
        if (!confirmed) {
          return;
        }
        await deleteUser(selectedUserId);
        setMessage("User deleted successfully.");
      }

      await Promise.all([fetchUsers(action !== "delete"), fetchLogs()]);
    } catch (err) {
      console.log(err);
      setMessage(err?.response?.data?.message || "Admin action failed.");
    }
  };

  const roleStyle = (role) => {
    if (role === "admin") return "bg-purple-50 text-purple-700";
    if (role === "recruiter") return "bg-amber-50 text-amber-700";
    return "bg-blue-50 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />

      <div className="flex pt-16">
        <AdminSidebar activeSection={activeSection} onChange={setActiveSection} />

        <main className="w-full p-6 md:ml-64 xl:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Platform Governance
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Admin Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Monitor users, review platform activity, and take action on account issues from one place.
              </p>
            </section>

            {message && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            )}

            <section id="overview" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runAuditVerification}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Verify Audit Chain
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchUsers(true);
                      fetchLogs();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
              <StatsCards stats={stats} />
              {verification && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    verification.valid
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border-red-100 bg-red-50 text-red-700"
                  }`}
                >
                  <p className="font-semibold">
                    {verification.valid ? "Audit chain verified" : "Audit chain issue detected"}
                  </p>
                  <p className="mt-1">{verification.message}</p>
                </div>
              )}
            </section>

            <section id="users" className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Review all users, their roles, and verification or suspension state.
                    </p>
                  </div>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by email, phone, or role"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 md:max-w-xs"
                  />
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-slate-500">
                      <tr className="border-b border-slate-100">
                        <th className="px-3 py-3 text-left font-semibold">User</th>
                        <th className="px-3 py-3 text-left font-semibold">Role</th>
                        <th className="px-3 py-3 text-left font-semibold">Status</th>
                        <th className="px-3 py-3 text-left font-semibold">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td className="px-3 py-6 text-slate-500" colSpan="4">
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-slate-500" colSpan="4">
                            No users matched your search.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                              selectedUserId === user.id ? "bg-blue-50/70" : ""
                            }`}
                          >
                            <td className="px-3 py-4">
                              <div className="font-medium text-slate-900 break-all">{user.email}</div>
                              <div className="mt-1 text-xs text-slate-400">{user.phone || "No phone"}</div>
                            </td>
                            <td className="px-3 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleStyle(user.role)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <div className="flex flex-wrap gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                  {user.isVerified ? "Verified" : "Pending"}
                                </span>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isSuspended ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                                  {user.isSuspended ? "Suspended" : "Active"}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-slate-600 whitespace-nowrap">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">User Detail</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Inspect the selected account and its profile record.
                    </p>
                  </div>
                </div>

                {loadingUserDetail ? (
                  <p className="mt-6 text-sm text-slate-500">Loading user detail...</p>
                ) : !selectedUser ? (
                  <p className="mt-6 text-sm text-slate-500">Select a user to inspect their record.</p>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
                      <p className="mt-1 break-all text-sm font-medium text-slate-900">{selectedUser.email}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role</p>
                        <p className="mt-1 text-sm text-slate-700 capitalize">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</p>
                        <p className="mt-1 text-sm text-slate-700">{selectedUser.phone || "Not available"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verified</p>
                        <p className="mt-1 text-sm text-slate-700">{selectedUser.isVerified ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Joined</p>
                        <p className="mt-1 text-sm text-slate-700">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Profile Snapshot</p>
                      {selectedUser.profile ? (
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <p><span className="font-semibold text-slate-800">Name:</span> {selectedUser.profile.name || "Not added"}</p>
                          <p><span className="font-semibold text-slate-800">Headline:</span> {selectedUser.profile.headline || "Not added"}</p>
                          <p><span className="font-semibold text-slate-800">Location:</span> {selectedUser.profile.location || "Not added"}</p>
                          <p><span className="font-semibold text-slate-800">Skills:</span> {selectedUser.profile.skills || "Not added"}</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-500">This user has not created a profile yet.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {selectedUser.isSuspended ? (
                        <button
                          type="button"
                          onClick={() => handleUserAction("unsuspend")}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Unsuspend User
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUserAction("suspend")}
                          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          Suspend User
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUserAction("delete")}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section id="logs" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Audit Logs</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Immutable records for authentication, job, application, message, and admin actions.
                </p>
              </div>
              <LogsTable logs={logs} loading={loadingLogs} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
