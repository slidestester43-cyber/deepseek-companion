import { useRef, useEffect } from "react";

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  time: string;
}

const POSITIVE_MESSAGES: ChatMessage[] = [
  { id: 1, user: "Player_99", text: "Let's gooo 🚀🔥", time: "12:01" },
  { id: 2, user: "Lucky_K", text: "Just hit 8x! This game is amazing!", time: "12:02" },
  { id: 3, user: "CrashKing", text: "Winning streak today 💰💰", time: "12:02" },
  { id: 4, user: "Nairobi7", text: "Best crash game ever! 🎉", time: "12:03" },
  { id: 5, user: "BetMaster", text: "Auto cashout at 2x works like a charm 🙌", time: "12:03" },
  { id: 6, user: "Swift22", text: "Just cashed out at 5x! Feeling great 💪", time: "12:04" },
  { id: 7, user: "KE_Gamer", text: "mozzatbet is the best platform 🔥", time: "12:05" },
  { id: 8, user: "WinnerKE", text: "Made my day with that 12x round! 🤑", time: "12:06" },
  { id: 9, user: "RocketMan", text: "To the moon! 🚀🌙", time: "12:06" },
  { id: 10, user: "ProPlayer", text: "Consistent wins today, love it! ❤️", time: "12:07" },
  { id: 11, user: "FastCash", text: "Cashed out just in time 😎", time: "12:08" },
  { id: 12, user: "LuckyDay", text: "This is my lucky day! 🍀", time: "12:09" },
];

const LiveChat = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden h-[280px]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Live Chat</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gaming-green animate-pulse" />
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">42</span> online
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {POSITIVE_MESSAGES.map((msg) => (
          <div key={msg.id} className="flex gap-2 text-xs">
            <span className="font-semibold text-primary shrink-0">{msg.user}:</span>
            <span className="text-secondary-foreground break-words">{msg.text}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-[10px]">{msg.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveChat;
