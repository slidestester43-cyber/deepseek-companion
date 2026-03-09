import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type GameState = "waiting" | "running" | "crashed";

interface Bet {
  amount: number;
  autoCashout: number | null;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  isDemo: boolean;
}

const CHANNEL_NAME = "crash-game-live";
const WAIT_DURATION = 5000;
const CRASH_DISPLAY = 3000;

export function useCrashGame() {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [roundCount, setRoundCount] = useState(0);
  const [crashHistory, setCrashHistory] = useState<number[]>([]);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef(0);
  const betSavedRef = useRef(false);
  const isLeaderRef = useRef(false);
  const channelRef = useRef<any>(null);
  const clientId = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const mountedRef = useRef(true);

  const { user, refreshBalance, isDemo, updateDemoBalance } = useAuth();

  // Cleanup helper
  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const generateCrashPoint = () => {
    const r = Math.random();
    return Math.min(Math.max(1.0, 1 / (1 - r) * 0.97), 100);
  };

  // Save bet result to DB
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

  // Start multiplier ticker
  const startTicker = useCallback((serverStart: number) => {
    if (tickRef.current) clearInterval(tickRef.current);
    startTimeRef.current = serverStart;
    tickRef.current = setInterval(() => {
      const elapsed = (Date.now() - serverStart) / 1000;
      const m = Math.pow(Math.E, elapsed * 0.15);
      setMultiplier(m);
    }, 50);
  }, []);

  // Leader round function stored in ref to allow recursion
  const startLeaderRoundRef = useRef<() => void>(() => {});

  useEffect(() => {
    startLeaderRoundRef.current = () => {
      if (!isLeaderRef.current || !channelRef.current || !mountedRef.current) return;
      clearAllTimers();

      const ch = channelRef.current;

      // Phase 1: Waiting
      setGameState("waiting");
      setCurrentBet(null);
      setMultiplier(1.0);

      ch.send({ type: "broadcast", event: "phase", payload: { phase: "waiting" } });

      // Phase 2: Running after wait
      const t1 = setTimeout(() => {
        if (!isLeaderRef.current || !mountedRef.current) return;

        const cp = generateCrashPoint();
        const startTime = Date.now();

        ch.send({ type: "broadcast", event: "phase", payload: { phase: "running", startTime } });
        window.dispatchEvent(new CustomEvent("admin-crash-point", { detail: cp }));

        // Leader starts its own ticker
        setGameState("running");
        setRoundCount(c => c + 1);
        betSavedRef.current = false;
        startTicker(startTime);

        // Phase 3: Crash
        const crashDelay = Math.log(cp) / 0.15 * 1000;
        const t2 = setTimeout(() => {
          if (!isLeaderRef.current || !mountedRef.current) return;

          ch.send({ type: "broadcast", event: "phase", payload: { phase: "crashed", crashPoint: cp } });

          // Leader handles crash locally
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
          setCrashPoint(cp);
          setMultiplier(cp);
          setGameState("crashed");
          setCrashHistory(prev => [Math.round(cp * 100) / 100, ...prev].slice(0, 20));

          // Next round
          const t3 = setTimeout(() => {
            startLeaderRoundRef.current();
          }, CRASH_DISPLAY);
          timeoutsRef.current.push(t3);
        }, crashDelay);
        timeoutsRef.current.push(t2);
      }, WAIT_DURATION);
      timeoutsRef.current.push(t1);
    };
  }, [clearAllTimers, startTicker]);

  // Evaluate leadership from presence
  const evaluateLeadership = useCallback(() => {
    if (!channelRef.current) return;
    const ps = channelRef.current.presenceState();
    const clients: { id: string; at: number }[] = [];
    Object.values(ps).forEach((arr: any) => {
      arr.forEach((p: any) => clients.push({ id: p.cid, at: p.at }));
    });
    if (clients.length === 0) return;

    clients.sort((a, b) => a.at - b.at);
    const wasLeader = isLeaderRef.current;
    isLeaderRef.current = clients[0].id === clientId.current;

    if (!wasLeader && isLeaderRef.current) {
      console.log("[CrashGame] Became leader, starting game loop");
      startLeaderRoundRef.current();
    }
  }, []);

  // Setup Realtime channel
  useEffect(() => {
    mountedRef.current = true;
    const ch = supabase.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false } }
    });
    channelRef.current = ch;

    // Followers handle broadcast events
    ch.on("broadcast", { event: "phase" }, ({ payload }) => {
      if (isLeaderRef.current) return; // Leader handles locally

      const { phase } = payload;
      if (phase === "waiting") {
        clearAllTimers();
        setGameState("waiting");
        setCurrentBet(null);
        setMultiplier(1.0);
      } else if (phase === "running") {
        setGameState("running");
        setRoundCount(c => c + 1);
        betSavedRef.current = false;
        startTicker(payload.startTime);
      } else if (phase === "crashed") {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
        const cp = payload.crashPoint;
        setCrashPoint(cp);
        setMultiplier(cp);
        setGameState("crashed");
        setCrashHistory(prev => [Math.round(cp * 100) / 100, ...prev].slice(0, 20));
      }
    });

    ch.on("presence", { event: "sync" }, evaluateLeadership);

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ cid: clientId.current, at: Date.now() });
      }
    });

    return () => {
      mountedRef.current = false;
      clearAllTimers();
      supabase.removeChannel(ch);
    };
  }, [clearAllTimers, startTicker, evaluateLeadership]);

  // Auto cashout
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
        updateDemoBalance(updatedBet.amount * multiplier);
      } else {
        saveBetResult(updatedBet, false);
      }
    }
  }, [multiplier, gameState, currentBet, saveBetResult, updateDemoBalance]);

  // Save loss on crash
  useEffect(() => {
    if (gameState === "crashed" && currentBet && !currentBet.cashedOut) {
      if (!currentBet.isDemo) {
        saveBetResult(currentBet, true);
      }
    }
  }, [gameState, currentBet, saveBetResult]);

  // Place bet
  const placeBet = useCallback(
    async (amount: number, autoCashout: number | null) => {
      const usingDemo = isDemo;

      if (usingDemo) {
        updateDemoBalance(-amount);
      } else if (user) {
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
    [user, refreshBalance, isDemo, updateDemoBalance]
  );

  // Cashout
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
