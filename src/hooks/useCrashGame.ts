import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type GameState = "waiting" | "running" | "crashed";

interface Bet {
  amount: number;
  autoCashout: number | null;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
}

export function useCrashGame() {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [roundCount, setRoundCount] = useState(0);
  const [crashHistory, setCrashHistory] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const betSavedRef = useRef(false);
  const { user, refreshBalance } = useAuth();

  const generateCrashPoint = () => {
    const r = Math.random();
    const crash = Math.max(1.0, 1 / (1 - r) * 0.97);
    return Math.min(crash, 100);
  };

  // Save bet result to database
  const saveBetResult = useCallback(async (bet: Bet, crashed: boolean) => {
    if (!user || betSavedRef.current) return;
    betSavedRef.current = true;

    const cashoutMult = bet.cashedOut ? bet.cashoutMultiplier : null;
    const profit = bet.cashedOut && cashoutMult
      ? bet.amount * cashoutMult - bet.amount
      : -bet.amount;

    try {
      // Save bet history
      await supabase.from("bet_history").insert({
        user_id: user.id,
        bet_amount: bet.amount,
        cashout_multiplier: cashoutMult,
        crashed: crashed && !bet.cashedOut,
        profit,
      });

      // Update balance: if cashed out, add winnings back
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

        // Update leaderboard
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
        setCrashHistory((prev) => [Math.round(cp * 100) / 100, ...prev].slice(0, 20));
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
  }, []);

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
      saveBetResult(updatedBet, false);
    }
  }, [multiplier, gameState, currentBet, saveBetResult]);

  // Save loss when crashed without cashout
  useEffect(() => {
    if (gameState === "crashed" && currentBet && !currentBet.cashedOut) {
      saveBetResult(currentBet, true);
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

      // Deduct balance immediately
      if (user) {
        const { data: balanceData } = await supabase
          .from("balances")
          .select("amount")
          .eq("user_id", user.id)
          .single();
        if (balanceData) {
          const newBalance = Number(balanceData.amount) - amount;
          if (newBalance < 0) return; // Insufficient funds
          await supabase
            .from("balances")
            .update({ amount: newBalance })
            .eq("user_id", user.id);
          await refreshBalance();
        }
      }

      betSavedRef.current = false;
      setCurrentBet({ amount, autoCashout, cashedOut: false, cashoutMultiplier: null });
    },
    [gameState, user, refreshBalance]
  );

  const cashout = useCallback(() => {
    if (gameState !== "running" || !currentBet || currentBet.cashedOut) return;
    const updatedBet = { ...currentBet, cashedOut: true, cashoutMultiplier: multiplier };
    setCurrentBet(updatedBet);
    saveBetResult(updatedBet, false);
  }, [gameState, currentBet, multiplier, saveBetResult]);

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
