import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

type GameState = "waiting" | "running" | "crashed";

interface BetControlsProps {
  gameState: GameState;
  onPlaceBet: (amount: number, autoCashout: number | null) => void;
  onCashout: () => void;
  hasBet: boolean;
}

const QUICK_STAKES = [50, 100, 200, 500];

const BetControls = ({ gameState, onPlaceBet, onCashout, hasBet }: BetControlsProps) => {
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const { user, balance } = useAuth();
  const navigate = useNavigate();

  const handleBet = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const cashout = autoCashoutEnabled ? parseFloat(autoCashout) : null;
    onPlaceBet(betAmount, cashout);
  };

  // Watch-only mode for non-authenticated users
  if (!user) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <LogIn className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Watch Mode</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You're watching the game as a demo. Sign in to place bets and win real KES!
          </p>
        </div>
        <Button
          onClick={() => navigate("/auth")}
          className="w-full py-3 text-sm font-bold uppercase tracking-wider"
        >
          Sign In to Play
        </Button>
        <p className="text-[10px] text-muted-foreground">New players get KES 1,000 starter balance</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Place Bet</h3>

      {/* Bet amount input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Bet Amount (KES)</label>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground font-mono text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Quick stakes */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_STAKES.map((stake) => (
            <button
              key={stake}
              onClick={() => setBetAmount(stake)}
              className={`py-1.5 rounded-md text-xs font-semibold transition-colors ${
                betAmount === stake
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
              }`}
            >
              {stake}
            </button>
          ))}
        </div>

        {/* Half / Double */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setBetAmount(Math.max(50, Math.floor(betAmount / 2)))}
            className="py-1.5 rounded-md text-xs font-semibold bg-secondary text-muted-foreground border border-border hover:text-foreground transition-colors"
          >
            ½
          </button>
          <button
            onClick={() => setBetAmount(betAmount * 2)}
            className="py-1.5 rounded-md text-xs font-semibold bg-secondary text-muted-foreground border border-border hover:text-foreground transition-colors"
          >
            2×
          </button>
        </div>
      </div>

      {/* Auto cashout */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">Auto Cash Out</label>
          <button
            onClick={() => setAutoCashoutEnabled(!autoCashoutEnabled)}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              autoCashoutEnabled ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${
                autoCashoutEnabled ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {autoCashoutEnabled && (
          <div className="relative">
            <input
              type="text"
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">x</span>
          </div>
        )}
      </div>

      {/* Main bet/cashout button */}
      {gameState === "running" && hasBet ? (
        <button
          onClick={onCashout}
          className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider bg-gaming-green text-primary-foreground glow-green transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Cash Out
        </button>
      ) : (
        <button
          onClick={handleBet}
          disabled={gameState === "running" || betAmount > balance}
          className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider bg-primary text-primary-foreground glow-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {gameState === "running" ? "Round in Progress" : betAmount > balance ? "Insufficient Balance" : "Place Bet"}
        </button>
      )}

      {/* Balance display */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Balance</span>
        <span className="font-mono text-sm font-semibold text-foreground">KES {balance.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default BetControls;
