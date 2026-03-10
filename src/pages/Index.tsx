import GameHeader from "@/components/GameHeader";
import CrashHistory from "@/components/CrashHistory";
import MultiplierDisplay from "@/components/MultiplierDisplay";
import BetControls from "@/components/BetControls";
import LiveBets from "@/components/LiveBets";

import Leaderboard from "@/components/Leaderboard";
import BettingRules from "@/components/BettingRules";
import { useCrashGame } from "@/hooks/useCrashGame";
import { useGameSounds } from "@/hooks/useGameSounds";
import { useEffect, useRef } from "react";

const Index = () => {
  const { gameState, multiplier, crashPoint, currentBet, roundCount, crashHistory, placeBet, cashout } = useCrashGame();
  const { playRoundStart, playCashout, playCrash } = useGameSounds();
  const prevStateRef = useRef(gameState);
  const prevCashedOutRef = useRef(false);

  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev !== gameState) {
      if (gameState === "running") playRoundStart();
      if (gameState === "crashed") playCrash();
      prevStateRef.current = gameState;
    }
  }, [gameState, playRoundStart, playCrash]);

  useEffect(() => {
    const cashedOut = currentBet?.cashedOut ?? false;
    if (cashedOut && !prevCashedOutRef.current) {
      playCashout();
    }
    prevCashedOutRef.current = cashedOut;
  }, [currentBet?.cashedOut, playCashout]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <GameHeader />
      <CrashHistory history={crashHistory} />

      {/* Main game area - fills remaining height */}
      <div className="flex-1 min-h-0 p-2 md:p-3 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] xl:grid-cols-[300px_1fr_300px] gap-2 md:gap-3 max-w-[1600px] mx-auto w-full">
        {/* Live bets + Leaderboard - LEFT side (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-col gap-2 md:gap-3 overflow-hidden">
          <LiveBets roundKey={roundCount} />
          <Leaderboard />
        </div>

        {/* Multiplier display - fills available height */}
        <div className="flex flex-col min-h-0">
          <MultiplierDisplay
            gameState={gameState}
            multiplier={multiplier}
            crashPoint={crashPoint}
          />
        </div>

        {/* Bet controls - RIGHT side */}
        <div className="flex flex-col gap-2 md:gap-3 min-h-0 overflow-y-auto">
          <BetControls
            gameState={gameState}
            onPlaceBet={placeBet}
            onCashout={cashout}
            hasBet={!!currentBet && !currentBet.cashedOut}
          />

          {currentBet?.cashedOut && currentBet.cashoutMultiplier && (
            <div className="bg-gaming-green/10 border border-gaming-green/30 rounded-xl p-3 text-center">
              <p className="text-xs text-gaming-green uppercase tracking-wider mb-1">Cashed Out!</p>
              <p className="font-mono text-xl font-bold text-gaming-green">
                {currentBet.cashoutMultiplier.toFixed(2)}x
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Won KES {(currentBet.amount * currentBet.cashoutMultiplier).toFixed(0)}
              </p>
            </div>
          )}
        </div>

        {/* Mobile: stacked bets below controls */}
        <div className="lg:hidden space-y-2 col-span-1">
          <LiveBets roundKey={roundCount} />
          <Leaderboard />
        </div>
      </div>

      {/* Footer - compact */}
      <footer className="border-t border-border px-4 py-2 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground shrink-0">
        <span>18+ Only</span>
        <span>•</span>
        <span>Play Responsibly</span>
        <span>•</span>
        <span>Provably Fair Gaming</span>
      </footer>
    </div>
  );
};

export default Index;
