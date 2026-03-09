import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type GameState = "waiting" | "running" | "crashed";

const CRASH_HISTORY_KEY = "mozzatbet_crash_history";

interface Bet {
  amount: number;
  autoCashout: number | null;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  isDemo: boolean;
}

export function useCrashGame() {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [roundCount, setRoundCount] = useState(0);
  const [crashHistory, setCrashHistory] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(CRASH_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const betSavedRef = useRef(false);
  const { user, refreshBalance, isDemo, updateDemoBalance } = useAuth();

  // Persist crash history to localStorage
  const updateCrashHistory = useCallback((cp: number) => {
    setCrashHistory((prev) => {
      const next = [Math.round(cp * 100) / 100, ...prev].slice(0, 20);
      localStorage.setItem(CRASH_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const generateCrashPoint = () => {
    const r = Math.random();
    const crash = Math.max(1.0, 1 / (1 - r) * 0.97);
    return Math.min(crash, 100);
  };

  const saveBetResult = useCallback(async (bet: Bet, crashed: boolean) => {
    if (bet.isDemo || !user || betSavedRef.current) return;
    betSavedRef.current = true;

    const cashoutMult = bet.cashedOut ? bet.cashoutMultiplier : null;
    const profit = bet.cashedOut && cashoutMult
      ? bet.amount * cashoutMult - bet.amount
      : -bet.amount;

    try {
      await supabase.from("bet_history").insert({
        user_id: user.id,
        bet_amount: bet.amount,
        cashout_multiplier: cashoutMult,
        crashed: crashed && !bet.cashedOut,
        profit,
      });

      if (bet.cashedOut && cashoutMult) {
        const winnings = bet.amount * cashoutMult;
        const { data: balanceData } = await supabase
          .from("balances")
          .select("amount")
          .eq("user_id", user.id)
          .single();
        if (balanceData) {
          await supabase
            .from("balances")
            .update({ amount: Number(balanceData.amount) + winnings })
            .eq("user_id", user.id);
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .single();
        const username = profile?.username || "Player";
        const today = new Date().toISOString().split("T")[0];

        const { data: existing } = await supabase
          .from("leaderboard_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .single();

        if (existing) {
          await supabase
            .from("leaderboard_entries")
            .update({
              best_multiplier: Math.max(Number(existing.best_multiplier), cashoutMult),
              total_winnings: Number(existing.total_winnings) + winnings,
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("leaderboard_entries").insert({
            user_id: user.id,
            username,
            best_multiplier: cashoutMult,
            total_winnings: winnings,
            date: today,
          });
        }
      }

      await refreshBalance();
    } catch (err) {
      console.error("Failed to save bet:", err);
    }
  }, [user, refreshBalance]);

  const startRound = useCallback(() => {
    const cp = generateCrashPoint();
    setCrashPoint(cp);
    setMultiplier(1.0);
    setGameState("running");
    setRoundCount((c) => c + 1);
    betSavedRef.current = false;
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newMult = Math.pow(Math.E, elapsed * 0.15);

      if (newMult >= cp) {
        setMultiplier(cp);
        setGameState("crashed");
        updateCrashHistory(cp);
        if (intervalRef.current) clearInterval(intervalRef.current);

        setTimeout(() => {
          setGameState("waiting");
          setCurrentBet(null);
          setTimeout(startRound, 2000);
        }, 3000);
      } else {
        setMultiplier(newMult);
      }
    }, 50);
  }, [updateCrashHistory]);

  // Auto cashout check
  useEffect(() => {
    if (
      gameState === "running" &&
      currentBet &&
      !currentBet.cashedOut &&
      currentBet.autoCashout &&
      multiplier >= currentBet.autoCashout
    ) {
      const updatedBet = { ...currentBet, cashedOut: true, cashoutMultiplier: multiplier };
      setCurrentBet(updatedBet);
      if (updatedBet.isDemo) {
        // Credit demo balance
        updateDemoBalance(updatedBet.amount * multiplier);
      } else {
        saveBetResult(updatedBet, false);
      }
    }
  }, [multiplier, gameState, currentBet, saveBetResult, updateDemoBalance]);

  // Save loss when crashed without cashout
  useEffect(() => {
    if (gameState === "crashed" && currentBet && !currentBet.cashedOut) {
      if (!currentBet.isDemo) {
        saveBetResult(currentBet, true);
      }
      // Demo losses: balance already deducted at bet time
    }
  }, [gameState, currentBet, saveBetResult]);

  // Start first round
  useEffect(() => {
    const timeout = setTimeout(startRound, 2000);
    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startRound]);

  const placeBet = useCallback(
    async (amount: number, autoCashout: number | null) => {
      const usingDemo = isDemo;

      if (usingDemo) {
        // Deduct from demo balance
        updateDemoBalance(-amount);
      } else if (user) {
        // Deduct from real balance
        const { data: balanceData } = await supabase
          .from("balances")
          .select("amount")
          .eq("user_id", user.id)
          .single();
        if (balanceData) {
          const newBalance = Number(balanceData.amount) - amount;
          if (newBalance < 0) return;
          await supabase
            .from("balances")
            .update({ amount: newBalance })
            .eq("user_id", user.id);
          await refreshBalance();
        }
      }

      betSavedRef.current = false;
      setCurrentBet({ amount, autoCashout, cashedOut: false, cashoutMultiplier: null, isDemo: usingDemo });
    },
    [gameState, user, refreshBalance, isDemo, updateDemoBalance]
  );

  const cashout = useCallback(() => {
    if (gameState !== "running" || !currentBet || currentBet.cashedOut) return;
    const updatedBet = { ...currentBet, cashedOut: true, cashoutMultiplier: multiplier };
    setCurrentBet(updatedBet);
    if (updatedBet.isDemo) {
      updateDemoBalance(updatedBet.amount * multiplier);
    } else {
      saveBetResult(updatedBet, false);
    }
  }, [gameState, currentBet, multiplier, saveBetResult, updateDemoBalance]);

  return {
    gameState,
    multiplier,
    crashPoint,
    currentBet,
    roundCount,
    crashHistory,
    placeBet,
    cashout,
  };
}
