import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  username: string;
  best_multiplier: number;
  total_winnings: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", username: "CrashKing", best_multiplier: 48.72, total_winnings: 125000 },
  { id: "2", username: "Lucky_K", best_multiplier: 32.15, total_winnings: 89000 },
  { id: "3", username: "RocketMan", best_multiplier: 27.88, total_winnings: 67500 },
  { id: "4", username: "BetMaster", best_multiplier: 19.45, total_winnings: 45200 },
  { id: "5", username: "Swift22", best_multiplier: 15.32, total_winnings: 38900 },
  { id: "6", username: "Nairobi7", best_multiplier: 12.67, total_winnings: 28400 },
  { id: "7", username: "ProPlayer", best_multiplier: 10.22, total_winnings: 22100 },
  { id: "8", username: "WinnerKE", best_multiplier: 8.90, total_winnings: 18700 },
];

const getRankStyle = (rank: number) => {
  if (rank === 1) return "text-gaming-gold";
  if (rank === 2) return "text-[hsl(var(--muted-foreground))]";
  if (rank === 3) return "text-primary";
  return "text-muted-foreground";
};

const getRankIcon = (rank: number) => {
  if (rank <= 3) return <Trophy className={`w-4 h-4 ${getRankStyle(rank)}`} />;
  return <span className="w-4 text-center text-xs text-muted-foreground font-mono">{rank}</span>;
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("id, username, best_multiplier, total_winnings")
        .eq("date", today)
        .order("best_multiplier", { ascending: false })
        .limit(10);
      if (data && data.length > 0) {
        setEntries(data);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-gaming-gold" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Winners</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">Today</span>
      </div>

      {/* Entries */}
      <div className="divide-y divide-border/30 max-h-[300px] overflow-y-auto">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className={`px-4 py-2.5 flex items-center gap-3 ${i === 0 ? "bg-gaming-gold/5" : ""}`}
          >
            <div className="w-6 flex justify-center">{getRankIcon(i + 1)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{entry.username}</p>
              <p className="text-[10px] text-muted-foreground">
                Won KES {entry.total_winnings.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-gaming-green">
                {entry.best_multiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
