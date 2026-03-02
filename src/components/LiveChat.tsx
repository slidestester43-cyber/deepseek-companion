import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  time: string;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 1, user: "Player_99", text: "Let's gooo 🚀", time: "12:01" },
  { id: 2, user: "Lucky_K", text: "Just hit 8x!", time: "12:02" },
  { id: 3, user: "CrashKing", text: "Who's betting big this round?", time: "12:02" },
  { id: 4, user: "Nairobi7", text: "50 KES only today 😂", time: "12:03" },
  { id: 5, user: "BetMaster", text: "Auto cashout at 2x is the way", time: "12:03" },
  { id: 6, user: "Swift22", text: "Crashed at 1.02 smh", time: "12:04" },
];

const LiveChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now(),
      user: "You",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
  };

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden h-[280px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Live Chat</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gaming-green animate-pulse" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">42</span> online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 text-xs">
            <span className="font-semibold text-primary shrink-0">{msg.user}:</span>
            <span className="text-secondary-foreground break-words">{msg.text}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-[10px]">{msg.time}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={sendMessage}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;
