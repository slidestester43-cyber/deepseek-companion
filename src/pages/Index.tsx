import GameHeader from "@/components/GameHeader";
import CrashHistory from "@/components/CrashHistory";
import MultiplierDisplay from "@/components/MultiplierDisplay";
import BetControls from "@/components/BetControls";
import LiveBets from "@/components/LiveBets";
import { useCrashGame } from "@/hooks/useCrashGame";

const Index = () => {
  const { gameState, multiplier, crashPoint, currentBet, placeBet, cashout } = useCrashGame();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GameHeader />
      <CrashHistory />

      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[320px_1fr_320px] gap-4 max-w-[1600px] mx-auto w-full">
        {/* Live bets - hidden on smaller screens, shown on xl */}
        <div className="hidden xl:block">
          <LiveBets />
        </div>

        {/* Multiplier display */}
        <div className="flex flex-col min-h-[400px] lg:min-h-0">
          <MultiplierDisplay
            gameState={gameState}
            multiplier={multiplier}
            crashPoint={crashPoint}
          />
        </div>

        {/* Bet controls + mobile live bets */}
        <div className="space-y-4">
          <BetControls
            gameState={gameState}
            onPlaceBet={placeBet}
            onCashout={cashout}
            hasBet={!!currentBet && !currentBet.cashedOut}
          />

          {/* Cashout notification */}
          {currentBet?.cashedOut && currentBet.cashoutMultiplier && (
            <div className="bg-gaming-green/10 border border-gaming-green/30 rounded-xl p-4 text-center">
              <p className="text-xs text-gaming-green uppercase tracking-wider mb-1">Cashed Out!</p>
              <p className="font-mono text-2xl font-bold text-gaming-green">
                {currentBet.cashoutMultiplier.toFixed(2)}x
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Won KES {(currentBet.amount * currentBet.cashoutMultiplier).toFixed(0)}
              </p>
            </div>
          )}

          {/* Live bets on smaller screens */}
          <div className="xl:hidden">
            <LiveBets />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-3 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span>18+ Only</span>
        <span>•</span>
        <span>Play Responsibly</span>
        <span>•</span>
        <span>Provably Fair Gaming</span>
        <span>•</span>
        <span>Licensed & Regulated</span>
      </footer>
    </div>
  );
};

export default Index;
