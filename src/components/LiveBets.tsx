import { useMemo } from "react";

const MOCK_BETS = [
  { id: 1, user: "Player_99", amount: 500, cashout: 2.34, won: true },
  { id: 2, user: "Lucky_K", amount: 1000, cashout: null, won: false },
  { id: 3, user: "CrashKing", amount: 200, cashout: 5.12, won: true },
  { id: 4, user: "Nairobi7", amount: 1500, cashout: null, won: false },
  { id: 5, user: "BetMaster", amount: 300, cashout: 1.85, won: true },
  { id: 6, user: "Ace_High", amount: 750, cashout: null, won: false },
  { id: 7, user: "Swift22", amount: 100, cashout: 3.41, won: true },
  { id: 8, user: "Moon_X", amount: 2000, cashout: null, won: false },
  { id: 9, user: "Blaze_r", amount: 400, cashout: 1.22, won: true },
  { id: 10, user: "KenyaBet", amount: 600, cashout: null, won: false },
  { id: 11, user: "Rocket_J", amount: 250, cashout: 8.90, won: true },
  { id: 12, user: "NightOwl", amount: 350, cashout: null, won: false },
];

const LiveBets = () => {
  const bets = useMemo(() => MOCK_BETS, []);
  const totalBets = bets.length;
  const totalAmount = bets.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Live Bets</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold">{totalBets}</span> players
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="text-foreground font-semibold font-mono">KES {totalAmount.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-4 py-2 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/50">
        <span>Player</span>
        <span className="text-right">Bet</span>
        <span className="text-right">Cashout</span>
      </div>

      {/* Bet rows */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className={`grid grid-cols-3 px-4 py-2.5 text-sm border-b border-border/30 transition-colors hover:bg-secondary/50 ${
              bet.won ? "bg-gaming-green/5" : ""
            }`}
          >
            <span className="text-secondary-foreground text-xs font-medium truncate">{bet.user}</span>
            <span className="text-right font-mono text-xs text-foreground">
              {bet.amount.toLocaleString()}
            </span>
            <span className="text-right font-mono text-xs font-semibold">
              {bet.cashout ? (
                <span className="text-gaming-green">{bet.cashout.toFixed(2)}x</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveBets;
