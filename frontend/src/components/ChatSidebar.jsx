import { useMemo, useState } from "react";

export default function ChatSidebar({
  chats,
  selectedUser,
  setSelectedUser,
}) {
  const [query, setQuery] = useState("");

  const filteredChats = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return chats;
    }

    return chats.filter((chat) =>
      `${chat.name || ""} ${chat.email || ""} ${chat.lastMessage || ""}`
        .toLowerCase()
        .includes(trimmedQuery)
    );
  }, [chats, query]);

  return (
    <div className="hidden w-80 border-r bg-white p-4 md:flex md:flex-col">
      <h2 className="mb-4 text-lg font-bold">Messages</h2>
      <input
        placeholder="Search chats..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
      <div className="space-y-3 overflow-y-auto">
        {filteredChats.map((chat) => (
          <div
            key={chat.userId}
            onClick={() => setSelectedUser(chat)}
            className={`cursor-pointer rounded-2xl border p-3 transition ${
              selectedUser?.userId === chat.userId
                ? "border-blue-100 bg-blue-50"
                : "border-transparent hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">
                  {chat.name || chat.email || "User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>
              {chat.unreadCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
        {filteredChats.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-gray-400">
            No conversations found.
          </p>
        )}
      </div>
    </div>
  );
}