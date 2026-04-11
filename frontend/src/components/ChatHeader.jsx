export default function ChatHeader({ user }) {
  return (
    <div className="flex items-center justify-between border-b bg-white p-4">
      <div>
        <h3 className="font-bold text-gray-900">
          {user?.name || user?.email || "Conversation"}
        </h3>
        <p className="text-xs text-gray-500">
          {user?.email || "Secure messaging enabled"}
        </p>
      </div>
      <div className="text-xs font-medium text-blue-600">Encrypted chat</div>
    </div>
  );
}