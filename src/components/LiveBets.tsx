import { useMemo } from "react";

const FIRST_NAMES = [
  "James", "Mary", "John", "Sarah", "Mike", "Grace", "Peter", "Faith", "David", "Joy",
  "Brian", "Ann", "Kevin", "Lucy", "Victor", "Rose", "Daniel", "Mercy", "Chris", "Esther",
  "Alex", "Jane", "Tom", "Nancy", "Sam", "Lilian", "Ben", "Diana", "Fred", "Carol",
  "Ian", "Winnie", "Paul", "Agnes", "Steve", "Betty", "Mark", "Judy", "Eric", "Gladys",
  "Ken", "Irene", "Phil", "Sharon", "Ray", "Rita", "Joe", "Cathy", "Nick", "Doris",
];

const SUFFIXES = ["_254", "_ke", "99", "X", "_bet", "7", "_pro", "001", "_vip", "KE", "_luck", "21", "_win", "88", "_boss"];

function generatePlayers(count: number) {
  const players = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      name = `${first}${suffix}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const amount = Math.round((Math.random() * 4800 + 200) / 50) * 50; // 200-5000, rounded to 50
    const won = Math.random() > 0.45; // ~55% lose
    const cashout = won ? +(Math.random() * 9 + 1.1).toFixed(2) : null;

    players.push({ id: i + 1, user: name, amount, cashout, won });
  }

  return players;
}

interface LiveBetsProps {
  roundKey?: number;
}

const LiveBets = ({ roundKey = 0 }: LiveBetsProps) => {
  const bets = useMemo(() => {
    const count = Math.floor(Math.random() * 51) + 50; // 50–100
    return generatePlayers(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKey]);

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
        <span className="text-right">Result</span>
      </div>

      {/* Bet rows */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className={`grid grid-cols-3 px-4 py-2.5 text-sm border-b border-border/30 transition-colors hover:bg-secondary/50 ${
              bet.won ? "bg-gaming-green/5" : "bg-destructive/5"
            }`}
          >
            <span className="text-secondary-foreground text-xs font-medium truncate">{bet.user}</span>
            <span className="text-right font-mono text-xs text-foreground">
              KES {bet.amount.toLocaleString()}
            </span>
            <span className="text-right font-mono text-xs font-semibold">
              {bet.cashout ? (
                <span className="text-gaming-green">{bet.cashout.toFixed(2)}x</span>
              ) : (
                <span className="text-destructive">Lost</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveBets;
