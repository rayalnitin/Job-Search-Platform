import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import {
  acceptConnectionRequest,
  getConnectionGraph,
  getConnections,
  getPendingConnections,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest,
} from "../../api/connections";

const tabs = [
  { id: "connect", label: "Connect" },
  { id: "connections", label: "Connections" },
  { id: "requests", label: "Requests" },
  { id: "graph", label: "Graph" },
];

const getFriendlyError = (err, fallback) => {
  if (err?.response?.status === 429) {
    return "Too many requests right now. Please wait a few seconds and try again.";
  }

  if (err?.response?.status >= 500) {
    return "The server hit an internal error. Please retry shortly.";
  }

  return err?.response?.data?.message || fallback;
};

export default function Networking() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialLoadRef = useRef(false);
  const tabEffectStartedRef = useRef(false);
  const [tab, setTab] = useState("connect");
  const [receiverIdentifier, setReceiverIdentifier] = useState("");
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [graph, setGraph] = useState({ totalConnections: 0, graph: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const role = localStorage.getItem("role") || "user";
  const isRecruiter = role === "recruiter" || location.pathname.startsWith("/recruiter/");
  const messagesPath = isRecruiter ? "/recruiter/messages" : "/messages";

  const loadTabData = async (targetTab, { force = false } = {}) => {
    try {
      setLoading(true);
      setMessage("");

      if (targetTab === "connect" || targetTab === "connections") {
        if (!force && connections.length && targetTab !== "connect") {
          return;
        }
        const res = await getConnections();
        setConnections(res.data || []);
        return;
      }

      if (targetTab === "requests") {
        if (!force && requests.length) {
          return;
        }
        const res = await getPendingConnections();
        setRequests(res.data || []);
        return;
      }

      if (!force && graph.graph?.length) {
        return;
      }
      const res = await getConnectionGraph();
      setGraph(res.data || { totalConnections: 0, graph: [] });
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Failed to load networking data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;
    loadTabData("connect", { force: true });
  }, []);

  useEffect(() => {
    if (!tabEffectStartedRef.current) {
      tabEffectStartedRef.current = true;
      return;
    }

    loadTabData(tab);
  }, [tab]);

  const connectionIds = useMemo(
    () => new Set(connections.map((connection) => connection.user.id)),
    [connections]
  );

  const handleSendRequest = async () => {
    if (!receiverIdentifier.trim()) {
      setMessage("Enter an email or UUID to send a connection request.");
      return;
    }

    try {
      const res = await sendConnectionRequest(receiverIdentifier.trim());
      setMessage(res.data.message || "Connection request sent successfully.");
      setReceiverIdentifier("");
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Failed to send request."));
    }
  };

  const handlePendingAction = async (id, action) => {
    try {
      if (action === "accept") {
        await acceptConnectionRequest(id);
        setMessage("Connection request accepted.");
      } else {
        await rejectConnectionRequest(id);
        setMessage("Connection request rejected.");
      }
      await loadTabData("requests", { force: true });
      await loadTabData("connections", { force: true });
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Request update failed."));
    }
  };

  const handleRemoveConnection = async (id) => {
    try {
      await removeConnection(id);
      setMessage("Connection removed successfully.");
      await loadTabData("connections", { force: true });
      setGraph({ totalConnections: 0, graph: [] });
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Failed to remove connection."));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="flex pt-16">
        {isRecruiter ? <RecruiterSidebar /> : <Sidebar />}
        <div
          className={
            isRecruiter
              ? "min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8"
              : "min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8"
          }
        >
          <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">
              {isRecruiter ? "Grow Your Recruiter Network" : "Build Your Network"}
            </h1>
            <p className="mt-2 text-gray-500">
              {isRecruiter
                ? "Review incoming connection requests, stay reachable for candidates, and build a trusted recruiter network using email or UUID."
                : "Manage connection requests, accepted connections, and your shared graph. You can now send a request using either the other person's account email or their UUID."}
            </p>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-b border-gray-200 pb-3">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === item.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
              Loading networking data...
            </div>
          ) : (
            <>
              {tab === "connect" && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Send Connection Request</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Paste the other user's email or UUID and the backend will create a request if allowed.
                    </p>

                    <div className="mt-5 flex flex-col gap-3 md:flex-row">
                      <input
                        value={receiverIdentifier}
                        onChange={(event) => setReceiverIdentifier(event.target.value)}
                        placeholder="Enter receiver email or UUID"
                        className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleSendRequest}
                        className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Send Request
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                    <div className="mt-5 space-y-4 text-sm">
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-400">Connections</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{connections.length}</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-400">How to connect</p>
                        <p className="mt-1 text-sm text-gray-700">Use email first. UUID from profile is still available as a fallback.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "connections" && (
                <div className="mt-6 space-y-4">
                  {connections.length ? (
                    connections.map((connection) => (
                      <div key={connection.connectionId} className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 break-all">{connection.user.email}</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Connected since {new Date(connection.connectedSince).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => navigate(`/profile/${connection.user.id}`)}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() =>
                              navigate(messagesPath, {
                                state: {
                                  selectedUser: {
                                    id: connection.user.id,
                                    userId: connection.user.id,
                                    email: connection.user.email,
                                    name: connection.user.email,
                                  },
                                },
                              })
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Message
                          </button>
                          <button
                            onClick={() => handleRemoveConnection(connection.connectionId)}
                            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
                      No accepted connections yet.
                    </div>
                  )}
                </div>
              )}

              {tab === "requests" && (
                <div className="mt-6 space-y-4">
                  {requests.length ? (
                    requests.map((request) => (
                      <div key={request.connectionId} className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 break-all">{request.from.email}</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Requested {new Date(request.requestedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handlePendingAction(request.connectionId, "accept")}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handlePendingAction(request.connectionId, "reject")}
                            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
                      No pending connection requests.
                    </div>
                  )}
                </div>
              )}

              {tab === "graph" && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Connection Graph</h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Limited mutual graph based on your accepted connections.
                    </p>
                  </div>

                  {graph.graph?.length ? (
                    graph.graph.map((entry) => (
                      <div key={entry.user.id} className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 break-all">{entry.user.email}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {connectionIds.has(entry.user.id) ? "Direct connection" : "Graph node"}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {entry.mutualConnections.length} mutual
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {entry.mutualConnections.length ? (
                            entry.mutualConnections.map((mutual) => (
                              <span key={mutual.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                {mutual.email}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No mutual connections exposed.</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
                      Build a few accepted connections to see your graph here.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
