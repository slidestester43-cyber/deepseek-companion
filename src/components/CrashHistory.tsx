import { useEffect, useRef } from "react";
import { useGameSounds } from "@/hooks/useGameSounds";

interface CrashHistoryProps {
  history: number[];
}

const CrashHistory = ({ history }: CrashHistoryProps) => {
  const prevLenRef = useRef(0);
  const { playHistoryPop } = useGameSounds();

  useEffect(() => {
    if (history.length > prevLenRef.current && prevLenRef.current > 0) {
      playHistoryPop(history[0]);
    }
    prevLenRef.current = history.length;
  }, [history.length, playHistoryPop]);

  const getColor = (val: number) => {
    if (val >= 10) return "text-gaming-gold";
    if (val >= 2) return "text-gaming-green";
    return "text-gaming-red";
  };

  const getBg = (val: number) => {
    if (val >= 10) return "bg-gaming-gold/10 border-gaming-gold/30";
    if (val >= 2) return "bg-gaming-green/10 border-gaming-green/30";
    return "bg-gaming-red/10 border-gaming-red/30";
  };

  const getGlow = (val: number, isNew: boolean) => {
    if (!isNew) return "";
    if (val >= 10) return "shadow-[0_0_12px_hsl(var(--gaming-gold)/0.4)]";
    if (val >= 2) return "shadow-[0_0_12px_hsl(var(--gaming-green)/0.4)]";
    return "";
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      <span className="text-xs text-muted-foreground font-medium shrink-0">History</span>
      {history.length === 0 && (
        <span className="text-xs text-muted-foreground">Waiting for rounds...</span>
      )}
      {history.map((value, i) => (
        <span
          key={`${history.length}-${i}-${value}`}
          className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${getColor(value)} ${getBg(value)} ${getGlow(value, i === 0)} ${i === 0 ? "animate-history-pop" : ""} transition-all duration-300`}
        >
          {value.toFixed(2)}x
        </span>
      ))}
    </div>
  );
};

export default CrashHistory;
