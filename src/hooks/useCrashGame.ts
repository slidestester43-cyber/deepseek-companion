import { useState, useEffect, useCallback, useRef } from "react";

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  const generateCrashPoint = () => {
    // Simple provably-fair-ish crash point generation
    const r = Math.random();
    // House edge ~3%
    const crash = Math.max(1.0, 1 / (1 - r) * 0.97);
    return Math.min(crash, 100); // cap at 100x
  };

  const startRound = useCallback(() => {
    const cp = generateCrashPoint();
    setCrashPoint(cp);
    setMultiplier(1.0);
    setGameState("running");
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth: starts slow, accelerates
      const newMult = Math.pow(Math.E, elapsed * 0.15);
      
      if (newMult >= cp) {
        setMultiplier(cp);
        setGameState("crashed");
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // Auto-restart after 3s
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
      setCurrentBet((prev) =>
        prev ? { ...prev, cashedOut: true, cashoutMultiplier: multiplier } : null
      );
    }
  }, [multiplier, gameState, currentBet]);

  // Start first round
  useEffect(() => {
    const timeout = setTimeout(startRound, 2000);
    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startRound]);

  const placeBet = useCallback(
    (amount: number, autoCashout: number | null) => {
      if (gameState === "running") return;
      setCurrentBet({ amount, autoCashout, cashedOut: false, cashoutMultiplier: null });
    },
    [gameState]
  );

  const cashout = useCallback(() => {
    if (gameState !== "running" || !currentBet || currentBet.cashedOut) return;
    setCurrentBet((prev) =>
      prev ? { ...prev, cashedOut: true, cashoutMultiplier: multiplier } : null
    );
  }, [gameState, currentBet, multiplier]);

  return {
    gameState,
    multiplier,
    crashPoint,
    currentBet,
    placeBet,
    cashout,
  };
}
