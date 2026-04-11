import { useState } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) {
      return;
    }

    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 border-t bg-white p-4">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 rounded-xl border px-3 py-2 outline-none focus:border-blue-500"
        placeholder="Type message..."
      />
      <button
        onClick={handleSend}
        className="rounded-xl bg-blue-600 px-4 text-white"
      >
        Send
      </button>
    </div>
  );
}