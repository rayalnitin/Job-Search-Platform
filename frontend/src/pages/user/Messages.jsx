import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import ChatSidebar from "../../components/ChatSidebar";
import ChatWindow from "../../components/ChatWindow";
import RightPanel from "../../components/RightPanel";
import { getInbox } from "../../api/message";

export default function Messages() {
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const initialUser = useMemo(() => {
    const stateUser = location.state?.selectedUser;
    if (!stateUser) {
      return null;
    }

    return {
      id: stateUser.id || stateUser.userId || stateUser.partnerId,
      userId: stateUser.userId || stateUser.id || stateUser.partnerId,
      name: stateUser.name || stateUser.email || stateUser.partnerEmail,
      email: stateUser.email || stateUser.partnerEmail || stateUser.name,
      lastMessage: stateUser.lastMessage || "",
      unreadCount: stateUser.unreadCount || 0,
    };
  }, [location.state]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await getInbox();
        const normalizedChats = res.data.map((chat) => ({
          id: chat.partnerId,
          userId: chat.partnerId,
          name: chat.partnerEmail,
          email: chat.partnerEmail,
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCount,
          sentAt: chat.sentAt,
        }));

        setChats(normalizedChats);

        if (initialUser) {
          const matchedChat = normalizedChats.find(
            (chat) => chat.userId === initialUser.userId
          );
          setSelectedUser(matchedChat || initialUser);
          return;
        }

        if (normalizedChats.length > 0) {
          setSelectedUser((current) => current || normalizedChats[0]);
        }
      } catch (err) {
        console.log(err);
      }
    };

    fetchChats();
  }, [initialUser]);

  return (
    <div className="h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-full pt-16">
        <ChatSidebar
          chats={chats}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
        <ChatWindow selectedUser={selectedUser} />
        <RightPanel selectedUser={selectedUser} />
      </div>
    </div>
  );
}