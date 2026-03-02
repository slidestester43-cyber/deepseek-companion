import { useMemo } from "react";

const HISTORY_DATA = [
  { id: 1, value: 6.64 },
  { id: 2, value: 1.62 },
  { id: 3, value: 1.08 },
  { id: 4, value: 12.45 },
  { id: 5, value: 2.31 },
  { id: 6, value: 1.00 },
  { id: 7, value: 3.87 },
  { id: 8, value: 1.24 },
  { id: 9, value: 7.92 },
  { id: 10, value: 1.55 },
  { id: 11, value: 22.10 },
  { id: 12, value: 4.03 },
  { id: 13, value: 1.12 },
  { id: 14, value: 2.67 },
  { id: 15, value: 1.89 },
];

const CrashHistory = () => {
  const items = useMemo(() => HISTORY_DATA, []);

  const getColor = (val: number) => {
    if (val >= 10) return "text-gaming-gold";
    if (val >= 2) return "text-gaming-green";
    return "text-gaming-red";
  };

  const getBg = (val: number) => {
    if (val >= 10) return "bg-gaming-gold/10";
    if (val >= 2) return "bg-gaming-green/10";
    return "bg-gaming-red/10";
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      <span className="text-xs text-muted-foreground font-medium shrink-0">History</span>
      {items.map((item) => (
        <span
          key={item.id}
          className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${getColor(item.value)} ${getBg(item.value)}`}
        >
          {item.value.toFixed(2)}x
        </span>
      ))}
    </div>
  );
};

export default CrashHistory;
