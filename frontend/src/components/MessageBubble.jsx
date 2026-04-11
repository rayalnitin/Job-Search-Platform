export default function MessageBubble({ type, text, sentAt }) {
  return (
    <div className={`flex ${type === "sent" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-sm rounded-2xl px-4 py-2 ${
          type === "sent"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        <p>{text}</p>
        {sentAt && (
          <p
            className={`mt-1 text-[11px] ${
              type === "sent" ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {new Date(sentAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}