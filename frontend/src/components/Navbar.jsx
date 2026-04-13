import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getNotifications } from "../api/notifications";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState(new Set());
  const pollingRef = useRef(null);
  const lastFetchedAtRef = useRef(null);

  const role = localStorage.getItem("role") || "user";
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const profilePath = role === "recruiter" ? "/recruiter/profile" : "/profile";
  const storageKey = storedUser?.id
    ? `notifications:seen:${storedUser.id}`
    : "notifications:seen:anonymous";

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
      { name: "Networking", path: "/recruiter/network" },
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

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !seenNotificationIds.has(notification.id)).length,
    [notifications, seenNotificationIds]
  );

  const persistSeenIds = (nextSeenIds) => {
    setSeenNotificationIds(nextSeenIds);
    localStorage.setItem(storageKey, JSON.stringify([...nextSeenIds]));
  };

  const mergeNotifications = (incoming, replace = false) => {
    setNotifications((current) => {
      const base = replace ? [] : current;
      const merged = new Map(base.map((item) => [item.id, item]));

      incoming.forEach((item) => {
        merged.set(item.id, item);
      });

      return Array.from(merged.values()).sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  };

  const loadNotifications = async (since) => {
    try {
      const res = await getNotifications(since);
      const nextItems = res.data?.items || [];

      if (nextItems.length > 0 || !since) {
        mergeNotifications(nextItems, !since);
        lastFetchedAtRef.current = res.data?.serverTime || new Date().toISOString();
      }
    } catch {
      // Leave the current feed in place if the poll fails.
    }
  };

  useEffect(() => {
    const savedSeenIds = localStorage.getItem(storageKey);
    if (savedSeenIds) {
      try {
        setSeenNotificationIds(new Set(JSON.parse(savedSeenIds)));
      } catch {
        setSeenNotificationIds(new Set());
      }
    }

    let cancelled = false;

    const startPolling = async () => {
      await loadNotifications();

      if (cancelled) {
        return;
      }

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      pollingRef.current = setInterval(() => {
        loadNotifications(lastFetchedAtRef.current || undefined);
      }, 15000);
    };

    startPolling();

    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [location.pathname, storageKey]);

  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const openNotification = (notification) => {
    const nextSeenIds = new Set(seenNotificationIds);
    nextSeenIds.add(notification.id);
    persistSeenIds(nextSeenIds);
    setNotificationsOpen(false);
    navigate(notification.link || "/dashboard");
  };

  const markAllNotificationsSeen = () => {
    persistSeenIds(new Set(notifications.map((notification) => notification.id)));
  };

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

        <div className="hidden min-w-0 gap-6 text-sm font-semibold lg:flex">
          {items.map((item) => (
            <Link key={item.path} to={item.path} className={active(item.path)}>
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setProfileOpen(false);
            setNotificationsOpen((prev) => !prev);
          }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-blue-50 hover:text-blue-700"
          title="Notifications"
        >
          <IconBell />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate(profilePath)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-blue-50 hover:text-blue-700"
          title="Profile settings"
        >
          <IconSettings />
        </button>

        <button
          type="button"
          onClick={() => {
            setNotificationsOpen(false);
            setProfileOpen((prev) => !prev);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-gray-200 text-sm font-bold text-blue-700"
        >
          {initials}
        </button>

        {notificationsOpen && (
          <div className="absolute right-14 top-12 w-[360px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">
                  {notifications.length ? `${unreadCount} unread` : "No recent activity"}
                </p>
              </div>
              <button
                type="button"
                onClick={markAllNotificationsSeen}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">
                  Live alerts will appear here as messages, applications, and requests change.
                </div>
              ) : (
                notifications.map((notification) => {
                  const unread = !seenNotificationIds.has(notification.id);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${
                        unread ? "bg-blue-50/40" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <span className="shrink-0 text-[11px] text-gray-400">
                              {new Date(notification.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {profileOpen && (
          <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
            <Link
              to={profilePath}
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setProfileOpen(false)}
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
