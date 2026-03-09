import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn, X } from "lucide-react";

type GameState = "waiting" | "running" | "crashed";

interface BetControlsProps {
  gameState: GameState;
  onPlaceBet: (amount: number, autoCashout: number | null) => void;
  onCashout: () => void;
  hasBet: boolean;
}

const QUICK_STAKES = [50, 100, 200, 500];
const COUNTDOWN_SECONDS = 3;
type BetPhase = "idle" | "countdown" | "queued";

const BetControls = ({ gameState, onPlaceBet, onCashout, hasBet }: BetControlsProps) => {
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBetRef = useRef<{ amount: number; cashout: number | null } | null>(null);
  const { user, balance } = useAuth();
  const navigate = useNavigate();

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    pendingBetRef.current = null;
  }, []);

  const handleBet = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (gameState !== "waiting") return;
    const cashout = autoCashoutEnabled ? parseFloat(autoCashout) : null;
    pendingBetRef.current = { amount: betAmount, cashout };
    setCountdown(COUNTDOWN_SECONDS);
  };

  const handleCancel = () => {
    clearCountdown();
  };

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      // Place the bet
      if (pendingBetRef.current) {
        onPlaceBet(pendingBetRef.current.amount, pendingBetRef.current.cashout);
      }
      clearCountdown();
      return;
    }

    countdownRef.current = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdown, onPlaceBet, clearCountdown]);

  // Cancel countdown if round starts
  useEffect(() => {
    if (gameState === "running" && countdown !== null) {
      // Place bet immediately when round starts during countdown
      if (pendingBetRef.current) {
        onPlaceBet(pendingBetRef.current.amount, pendingBetRef.current.cashout);
      }
      clearCountdown();
    }
  }, [gameState, countdown, onPlaceBet, clearCountdown]);

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
            disabled={countdown !== null}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground font-mono text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
        </div>

        {/* Quick stakes */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_STAKES.map((stake) => (
            <button
              key={stake}
              onClick={() => setBetAmount(stake)}
              disabled={countdown !== null}
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
            disabled={countdown !== null}
            className="py-1.5 rounded-md text-xs font-semibold bg-secondary text-muted-foreground border border-border hover:text-foreground transition-colors disabled:opacity-50"
          >
            ½
          </button>
          <button
            onClick={() => setBetAmount(betAmount * 2)}
            disabled={countdown !== null}
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
            disabled={countdown !== null}
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
              disabled={countdown !== null}
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
      ) : countdown !== null ? (
        <div className="space-y-2">
          {/* Countdown progress */}
          <div className="bg-secondary border border-primary/30 rounded-xl p-4 text-center space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Placing bet in</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-3xl font-bold text-primary animate-pulse">{countdown}</span>
              <span className="text-sm text-muted-foreground">sec</span>
            </div>
            <p className="text-xs text-muted-foreground">
              KES {betAmount.toLocaleString()} bet
              {autoCashoutEnabled ? ` • Auto cashout at ${autoCashout}x` : ""}
            </p>
            {/* Progress bar */}
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}%` }}
              />
            </div>
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
