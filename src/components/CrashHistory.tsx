interface CrashHistoryProps {
  history: number[];
}

const CrashHistory = ({ history }: CrashHistoryProps) => {
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
      {history.length === 0 && (
        <span className="text-xs text-muted-foreground">Waiting for rounds...</span>
      )}
      {history.map((value, i) => (
        <span
          key={`${i}-${value}`}
          className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${getColor(value)} ${getBg(value)}`}
        >
          {value.toFixed(2)}x
        </span>
      ))}
    </div>
  );
};

export default CrashHistory;
