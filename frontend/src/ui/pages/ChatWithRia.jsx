import React, { useEffect, useRef, useState } from "react";

// Updated API constant to match the server.js route
const API = "http://localhost:5000/api/chat";

export default function ChatWithRia() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I’m Ria 👋. Ask me anything about inventory or sales data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      // The fetch URL is updated to correctly append `/ask` to the API constant.
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: data.answer || "🤔 Sorry, I couldn’t find that in the dataset.",
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: `⚠️ Error: ${data.error || "Unknown"}` },
        ]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `🌐 Network error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="h-screen bg-[#0b1c3a] text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-bold">Chat With ‘Ria’</h2>
        <span className="text-sm text-gray-400">
          Answers are grounded in your DB + CSV
        </span>
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              m.role === "user"
                ? "ml-auto bg-blue-600/70"
                : "bg-[#14294d]"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.text}</p>
          </div>
        ))}

        {loading && (
          <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#14294d] animate-pulse">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-700 flex gap-2">
        <textarea
          className="flex-1 min-h-[44px] max-h-[120px] bg-[#14294d] border border-gray-700 rounded-xl px-3 py-2 focus:outline-none resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about stock levels, update dates, product IDs, etc."
        />
        <button
          onClick={send}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
