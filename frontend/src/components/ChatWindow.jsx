import { useEffect, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { getConversation, sendMessage } from "../api/message";

export default function ChatWindow({ selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const userId = selectedUser.userId || selectedUser.id;
        const res = await getConversation(userId);
        setMessages(res.data);
      } catch (err) {
        console.log("Fetch messages error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  const handleSend = async (text) => {
    if (!text.trim() || !selectedUser) {
      return;
    }

    const receiverId = selectedUser.userId || selectedUser.id;

    try {
      await sendMessage({
        receiverId,
        content: text,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          content: text,
          senderId: currentUserId,
          receiverId,
          sentAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.log("Send message error:", err);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Select a conversation to start chatting.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader user={selectedUser} />
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400">
            No messages yet. Say hello to start the conversation.
          </p>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;

            return (
              <MessageBubble
                key={msg.id || i}
                type={isMe ? "sent" : "received"}
                text={msg.content}
                sentAt={msg.sentAt}
              />
            );
          })
        )}
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
}