import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn, X, Wallet } from "lucide-react";

type GameState = "waiting" | "running" | "crashed";

interface BetControlsProps {
  gameState: GameState;
  onPlaceBet: (amount: number, autoCashout: number | null) => void;
  onCashout: () => void;
  hasBet: boolean;
}

const QUICK_STAKES = [50, 100, 200, 500];

type BetPhase = "idle" | "pending" | "queued";

const BetControls = ({ gameState, onPlaceBet, onCashout, hasBet }: BetControlsProps) => {
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [betPhase, setBetPhase] = useState<BetPhase>("idle");
  const pendingBetRef = useRef<{ amount: number; cashout: number | null } | null>(null);
  const { user, balance, demoBalance, isDemo } = useAuth();
  const navigate = useNavigate();

  const activeBalance = isDemo ? demoBalance : balance;

  const handleBet = () => {
    const cashout = autoCashoutEnabled ? parseFloat(autoCashout) : null;
    pendingBetRef.current = { amount: betAmount, cashout };

    if (gameState === "waiting") {
      onPlaceBet(betAmount, cashout);
      setBetPhase("idle");
      pendingBetRef.current = null;
    } else if (gameState === "running") {
      setBetPhase("queued");
    }
  };

  const handleCancel = () => {
    pendingBetRef.current = null;
    setBetPhase("idle");
  };

  useEffect(() => {
    if (gameState === "waiting" && betPhase === "queued" && pendingBetRef.current) {
      onPlaceBet(pendingBetRef.current.amount, pendingBetRef.current.cashout);
      pendingBetRef.current = null;
      setBetPhase("idle");
    }
  }, [gameState, betPhase, onPlaceBet]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Mode indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Place Bet</h3>
        {!user ? (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            Demo Mode
          </span>
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gaming-green/20 text-gaming-green border border-gaming-green/30">
            Real Money
          </span>
        )}
      </div>

      {/* Bet amount input */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Bet Amount (KES)</label>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            disabled={betPhase !== "idle"}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground font-mono text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Quick stakes */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_STAKES.map((stake) => (
            <button
              key={stake}
              onClick={() => setBetAmount(stake)}
              disabled={betPhase !== "idle"}
              className={`py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
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
            disabled={betPhase !== "idle"}
            className="py-1.5 rounded-md text-xs font-semibold bg-secondary text-muted-foreground border border-border hover:text-foreground transition-colors disabled:opacity-50"
          >
            ½
          </button>
          <button
            onClick={() => setBetAmount(betAmount * 2)}
            disabled={betPhase !== "idle"}
            className="py-1.5 rounded-md text-xs font-semibold bg-secondary text-muted-foreground border border-border hover:text-foreground transition-colors disabled:opacity-50"
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
            disabled={betPhase !== "idle"}
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
              disabled={betPhase !== "idle"}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
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
      ) : betPhase === "queued" ? (
        <div className="space-y-2">
          <div className="bg-gaming-green/10 border border-gaming-green/30 rounded-xl p-4 text-center space-y-1">
            <p className="text-xs text-gaming-green uppercase tracking-wider font-semibold animate-pulse">Bet Queued</p>
            <p className="text-sm text-foreground font-mono font-bold">KES {betAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Activates when next round starts</p>
          </div>
          <button
            onClick={handleCancel}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider bg-destructive/20 text-destructive border border-destructive/30 transition-all hover:bg-destructive/30 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel Bet
          </button>
        </div>
      ) : (
        <button
          onClick={handleBet}
          disabled={betAmount > activeBalance || gameState === "crashed"}
          className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider bg-primary text-primary-foreground glow-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {betAmount > activeBalance
            ? "Insufficient Balance"
            : gameState === "running"
            ? "Place Bet (Next Round)"
            : gameState === "crashed"
            ? "Round Ending..."
            : "Place Bet"}
        </button>
      )}

      {/* Balance display */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Balance</span>
          {isDemo && (
            <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-accent text-accent-foreground leading-none">Demo</span>
          )}
        </div>
        <span className="font-mono text-sm font-semibold text-foreground">KES {activeBalance.toLocaleString()}</span>
      </div>

      {/* Sign in prompt for non-authenticated */}
      {!user && (
        <div className="pt-2 border-t border-border text-center space-y-2">
          <p className="text-[10px] text-muted-foreground">Sign in to deposit real money and withdraw winnings</p>
          <Button
            size="sm"
            onClick={() => navigate("/auth")}
            className="text-xs gap-1.5"
          >
            <LogIn className="w-3 h-3" /> Sign In
          </Button>
        </div>
      )}
    </div>
  );
};

export default BetControls;
