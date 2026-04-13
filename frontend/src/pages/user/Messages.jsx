import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import {
  createGroup,
  getConversation,
  getE2eeConversation,
  getE2eeInbox,
  getE2eePublicKey,
  getGroups,
  getGroupConversation,
  getInbox,
  registerE2eePublicKey,
  sendE2eeMessage,
  sendGroupMessage,
  sendMessage,
} from "../../api/message";
import { getConnections } from "../../api/connections";
import {
  decryptCiphertext,
  encryptForRecipient,
  generateAndStoreE2eeKeys,
  getStoredE2eeKeys,
} from "../../utils/e2ee";

const tabs = [
  { id: "direct", label: "Direct" },
  { id: "group", label: "Groups" },
  { id: "e2ee", label: "E2EE" },
];

const getFriendlyError = (err, fallback) => {
  if (err?.response?.status === 429) {
    return "Too many requests right now. Please wait a moment and try again.";
  }

  if (err?.response?.status >= 500) {
    return "The server hit an internal error. Please retry in a few seconds.";
  }

  return err?.response?.data?.message || fallback;
};

export default function Messages() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id;
  const initialLoadRef = useRef(false);
  const modeEffectStartedRef = useRef(false);

  const [activeMode, setActiveMode] = useState("direct");
  const [threads, setThreads] = useState({ direct: [], group: [], e2ee: [] });
  const [connections, setConnections] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [message, setMessage] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupParticipantIds, setGroupParticipantIds] = useState([]);
  const [e2eeReady, setE2eeReady] = useState(false);

  const initialDirectUser = useMemo(() => {
    const stateUser = location.state?.selectedUser;
    if (!stateUser) {
      return null;
    }

    return {
      id: stateUser.id || stateUser.userId || stateUser.partnerId,
      userId: stateUser.userId || stateUser.id || stateUser.partnerId,
      title: stateUser.name || stateUser.email || stateUser.partnerEmail,
      email: stateUser.email || stateUser.partnerEmail || stateUser.name,
      lastMessage: stateUser.lastMessage || "",
      unreadCount: stateUser.unreadCount || 0,
      mode: "direct",
    };
  }, [location.state]);

  const selectedParticipantsLabel = useMemo(() => {
    if (!selectedThread) {
      return "";
    }

    if (selectedThread.mode === "group") {
      return `${selectedThread.participants?.length || 0} participants`;
    }

    return selectedThread.email || "Secure chat enabled";
  }, [selectedThread]);

  const ensureConnections = async () => {
    if (connections.length) {
      return connections;
    }

    const res = await getConnections();
    const next = res.data || [];
    setConnections(next);
    return next;
  };

  const loadThreadsForMode = async (mode, { force = false } = {}) => {
    if (!force && threads[mode]?.length) {
      return;
    }

    try {
      setLoadingList(true);
      setMessage("");

      if (mode === "direct") {
        const [directRes, connectionsRes] = await Promise.all([
          getInbox(),
          ensureConnections(),
        ]);

        const nextConnections = connectionsRes || [];
        const directInbox = (directRes.data || []).map((chat) => ({
          id: chat.partnerId,
          userId: chat.partnerId,
          title: chat.partnerEmail,
          email: chat.partnerEmail,
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCount,
          sentAt: chat.sentAt,
          mode: "direct",
        }));

        const directIds = new Set(directInbox.map((chat) => chat.userId));
        const directFromConnections = nextConnections
          .filter((connection) => !directIds.has(connection.user.id))
          .map((connection) => ({
            id: connection.user.id,
            userId: connection.user.id,
            title: connection.user.email,
            email: connection.user.email,
            lastMessage: "Start a secure conversation",
            unreadCount: 0,
            mode: "direct",
          }));

        const nextDirect = [...directInbox, ...directFromConnections];
        if (
          initialDirectUser &&
          !nextDirect.some((thread) => thread.userId === initialDirectUser.userId)
        ) {
          nextDirect.unshift(initialDirectUser);
        }

        setConnections(nextConnections);
        setThreads((prev) => ({ ...prev, direct: nextDirect }));
        setSelectedThread((current) =>
          current?.mode === "direct"
            ? nextDirect.find((thread) => thread.id === current.id) || nextDirect[0] || null
            : nextDirect[0] || null
        );
        return;
      }

      if (mode === "group") {
        const [groupRes, connectionsRes] = await Promise.all([
          getGroups(),
          ensureConnections(),
        ]);
        const nextConnections = connectionsRes || [];
        const nextGroups = (groupRes.data || []).map((group) => ({
          id: group.id,
          title: group.name,
          subtitle: group.createdBy?.email || "Group conversation",
          participants: group.participants || [],
          createdBy: group.createdBy,
          mode: "group",
        }));

        setConnections(nextConnections);
        setThreads((prev) => ({ ...prev, group: nextGroups }));
        setSelectedThread((current) =>
          current?.mode === "group"
            ? nextGroups.find((thread) => thread.id === current.id) || nextGroups[0] || null
            : nextGroups[0] || null
        );
        return;
      }

      const [e2eeRes, connectionsRes] = await Promise.all([
        getE2eeInbox(),
        ensureConnections(),
      ]);
      const nextConnections = connectionsRes || [];
      const e2eeInbox = (e2eeRes.data || []).map((chat) => ({
        id: chat.partnerId,
        userId: chat.partnerId,
        title: chat.partnerEmail,
        email: chat.partnerEmail,
        unreadCount: chat.unreadCount,
        sentAt: chat.lastMessageAt,
        encrypted: chat.encrypted,
        lastMessage: "Encrypted preview hidden by design",
        mode: "e2ee",
      }));

      const e2eeIds = new Set(e2eeInbox.map((chat) => chat.userId));
      const e2eeFromConnections = nextConnections
        .filter((connection) => !e2eeIds.has(connection.user.id))
        .map((connection) => ({
          id: connection.user.id,
          userId: connection.user.id,
          title: connection.user.email,
          email: connection.user.email,
          unreadCount: 0,
          encrypted: true,
          lastMessage: "Enable E2EE and start a protected conversation",
          mode: "e2ee",
        }));

      const nextE2ee = [...e2eeInbox, ...e2eeFromConnections];
      setConnections(nextConnections);
      setThreads((prev) => ({ ...prev, e2ee: nextE2ee }));
      setSelectedThread((current) =>
        current?.mode === "e2ee"
          ? nextE2ee.find((thread) => thread.id === current.id) || nextE2ee[0] || null
          : nextE2ee[0] || null
      );
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Failed to load messages."));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;
    loadThreadsForMode("direct", { force: true });
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const storedKeys = getStoredE2eeKeys(currentUserId);
    setE2eeReady(Boolean(storedKeys.publicKeyPem && storedKeys.privateKeyPem));
  }, [currentUserId]);

  useEffect(() => {
    if (!modeEffectStartedRef.current) {
      modeEffectStartedRef.current = true;
      return;
    }

    loadThreadsForMode(activeMode);
  }, [activeMode]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setMessage("");

        if (selectedThread.mode === "direct") {
          const res = await getConversation(selectedThread.userId || selectedThread.id);
          setMessages(res.data || []);
          return;
        }

        if (selectedThread.mode === "group") {
          const res = await getGroupConversation(selectedThread.id);
          setMessages(res.data.messages || []);
          return;
        }

        const storedKeys = getStoredE2eeKeys(currentUserId);
        if (!storedKeys.privateKeyPem) {
          setMessages([]);
          setMessage("Set up E2EE keys first to decrypt conversations.");
          return;
        }

        const res = await getE2eeConversation(selectedThread.userId || selectedThread.id);
        const decryptedMessages = [];
        let failedDecryptCount = 0;

        const decryptedResults = await Promise.allSettled(
          (res.data || []).map(async (item) => ({
            ...item,
            content: await decryptCiphertext(item.ciphertext, storedKeys.privateKeyPem),
          }))
        );

        decryptedResults.forEach((result) => {
          if (result.status === "fulfilled") {
            decryptedMessages.push(result.value);
            return;
          }

          failedDecryptCount += 1;
        });

        setMessages(decryptedMessages);

        if (failedDecryptCount > 0) {
          setMessage(
            decryptedMessages.length > 0
              ? "Some encrypted messages could not be decrypted with the current local key."
              : "This conversation was encrypted with a different local key. Re-registering creates a new key for future messages, but old messages need the previous private key."
          );
        }
        return;
      } catch (err) {
        console.log(err);
        setMessages([]);
        setMessage(getFriendlyError(err, "Failed to load conversation."));
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentUserId, selectedThread]);

  const handleSend = async () => {
    if (!text.trim() || !selectedThread) {
      return;
    }

    try {
      const draft = text.trim();
      setText("");
      setMessage("");

      if (selectedThread.mode === "direct") {
        await sendMessage({
          receiverId: selectedThread.userId || selectedThread.id,
          content: draft,
        });
        setMessages((prev) => [
          ...prev,
          { id: `temp-${Date.now()}`, senderId: currentUserId, from: "me", content: draft, sentAt: new Date().toISOString() },
        ]);
        setThreads((prev) => ({
          ...prev,
          direct: prev.direct.map((thread) =>
            thread.id === selectedThread.id ? { ...thread, lastMessage: draft } : thread
          ),
        }));
        return;
      }

      if (selectedThread.mode === "group") {
        await sendGroupMessage(selectedThread.id, { content: draft });
        setMessages((prev) => [
          ...prev,
          { id: `temp-${Date.now()}`, senderId: currentUserId, from: "me", content: draft, sentAt: new Date().toISOString() },
        ]);
        return;
      }

      const storedKeys = getStoredE2eeKeys(currentUserId);
      if (!storedKeys.privateKeyPem) {
        setMessage("Generate and register your E2EE key pair first.");
        setText(draft);
        return;
      }

      const publicKeyRes = await getE2eePublicKey(selectedThread.userId || selectedThread.id);
      const ciphertext = await encryptForRecipient(draft, publicKeyRes.data.publicKey);
      await sendE2eeMessage({
        receiverId: selectedThread.userId || selectedThread.id,
        ciphertext,
      });
      setMessages((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, senderId: currentUserId, from: "me", content: draft, sentAt: new Date().toISOString(), integrity: { note: "Encrypted and queued successfully." } },
      ]);
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Failed to send message."));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || groupParticipantIds.length === 0) {
      setMessage("Enter a group name and choose at least one connection.");
      return;
    }

    try {
      const res = await createGroup({
        name: groupName.trim(),
        participantIds: groupParticipantIds,
      });
      setGroupName("");
      setGroupParticipantIds([]);
      setActiveMode("group");
      setMessage("Group created successfully.");
      await loadThreadsForMode("group", { force: true });
      setSelectedThread({
        id: res.data.group.id,
        title: res.data.group.name,
        participants: res.data.group.participants,
        createdBy: { id: currentUserId, email: currentUser?.email },
        mode: "group",
      });
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Failed to create group."));
    }
  };

  const handleE2eeSetup = async () => {
    if (!currentUserId) {
      return;
    }

    try {
      const storedKeys = getStoredE2eeKeys(currentUserId);
      const keys = storedKeys.publicKeyPem && storedKeys.privateKeyPem
        ? storedKeys
        : await generateAndStoreE2eeKeys(currentUserId);

      await registerE2eePublicKey(keys.publicKeyPem);
      setE2eeReady(true);
      setMessage("E2EE enabled. Your private key is stored locally in this browser.");
    } catch (err) {
      console.log(err);
      setMessage(getFriendlyError(err, "Failed to set up E2EE."));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1600px] flex-col px-4 py-6 xl:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="mt-1 text-sm text-gray-500">
                Direct chat, group coordination, and end-to-end encrypted conversations in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMode(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeMode === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {message}
            </div>
          )}

          <div className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
            <aside className="flex min-h-0 flex-col rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeMode === "direct" ? "Direct Inbox" : activeMode === "group" ? "Groups" : "E2EE Inbox"}
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {(threads[activeMode] || []).length}
                </span>
              </div>

              {activeMode === "group" && (
                <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Create Group</p>
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Interview Panel"
                    className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                    {connections.length ? (
                      connections.map((connection) => (
                        <label key={connection.connectionId} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={groupParticipantIds.includes(connection.user.id)}
                            onChange={(event) => {
                              setGroupParticipantIds((prev) =>
                                event.target.checked
                                  ? [...prev, connection.user.id]
                                  : prev.filter((id) => id !== connection.user.id)
                              );
                            }}
                          />
                          <span className="truncate">{connection.user.email}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">Load direct conversations or networking first to add participants.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create Group
                  </button>
                </div>
              )}

              {activeMode === "e2ee" && (
                <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm">
                  <p className="font-semibold text-gray-900">End-to-End Encryption</p>
                  <p className="mt-2 text-gray-500">
                    Generate a local key pair and register your public key before sending E2EE messages.
                  </p>
                  <button
                    type="button"
                    onClick={handleE2eeSetup}
                    className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {e2eeReady ? "Re-register Key" : "Enable E2EE"}
                  </button>
                </div>
              )}

              <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
                {loadingList ? (
                  <p className="text-sm text-gray-400">Loading conversations...</p>
                ) : (threads[activeMode] || []).length ? (
                  (threads[activeMode] || []).map((thread) => (
                    <button
                      key={`${thread.mode}-${thread.id}`}
                      type="button"
                      onClick={() => setSelectedThread(thread)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        selectedThread?.id === thread.id && selectedThread?.mode === thread.mode
                          ? "border-blue-100 bg-blue-50"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{thread.title}</p>
                          <p className="truncate text-xs text-gray-500">{thread.lastMessage || thread.subtitle || thread.email || "No messages yet"}</p>
                        </div>
                        {thread.unreadCount > 0 && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No conversations found for this mode.</p>
                )}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col rounded-3xl border border-gray-100 bg-white shadow-sm">
              {selectedThread ? (
                <>
                  <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedThread.title}</h3>
                      <p className="text-xs text-gray-500">{selectedParticipantsLabel}</p>
                    </div>
                    <div className="text-xs font-medium text-blue-600">
                      {selectedThread.mode === "e2ee" ? "End-to-end encrypted" : selectedThread.mode === "group" ? "Encrypted group chat" : "Encrypted direct chat"}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                    {loadingMessages ? (
                      <p className="text-sm text-gray-400">Loading conversation...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-gray-400">No messages yet. Start the conversation below.</p>
                    ) : (
                      messages.map((msg, index) => {
                        const isMe = msg.senderId === currentUserId || msg.from === "me";

                        return (
                          <div key={msg.id || index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xl rounded-2xl px-4 py-3 ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                              {!isMe && selectedThread.mode === "group" && (
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{msg.from}</p>
                              )}
                              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                              <p className={`mt-2 text-[11px] ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                                {new Date(msg.sentAt).toLocaleString()}
                              </p>
                              {msg.integrity?.note && (
                                <p className={`mt-1 text-[11px] ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                                  {msg.integrity.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t p-4">
                    <div className="flex gap-3">
                      <textarea
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        placeholder={selectedThread.mode === "e2ee" ? "Write an encrypted message..." : "Type your message..."}
                        className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-400">Select a conversation to begin.</div>
              )}
            </section>

            <aside className="hidden min-h-0 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm xl:block">
              <h3 className="text-lg font-semibold text-gray-900">Conversation Info</h3>
              {selectedThread ? (
                <div className="mt-5 space-y-5 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Mode</p>
                    <p className="mt-1 capitalize text-gray-800">{selectedThread.mode}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Title</p>
                    <p className="mt-1 break-all text-gray-800">{selectedThread.title}</p>
                  </div>
                  {selectedThread.email && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Contact</p>
                      <p className="mt-1 break-all text-gray-800">{selectedThread.email}</p>
                    </div>
                  )}
                  {selectedThread.mode === "group" && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Participants</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(selectedThread.participants || []).map((participant) => (
                          <span key={participant.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {participant.email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
                    {selectedThread.mode === "e2ee"
                      ? "E2EE conversations store ciphertext only on the server. Message previews are intentionally hidden in the inbox."
                      : "Server-side encryption and PKI integrity checks are active for this conversation."}
                  </div>

                  {(selectedThread.mode === "direct" || selectedThread.mode === "e2ee") && selectedThread.id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${selectedThread.id}`)}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      View Profile
                    </button>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-400">Choose a thread to inspect its details.</p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
