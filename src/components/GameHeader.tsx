import { Rocket, Shield, Smartphone } from "lucide-react";

const GameHeader = () => {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center glow-primary">
          <Rocket className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground tracking-tight">CrashX</span>
          <span className="text-[10px] text-muted-foreground leading-none">Provably Fair</span>
        </div>
      </div>

      {/* Center badges */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border">
          <Shield className="w-3.5 h-3.5 text-gaming-green" />
          <span className="text-xs text-secondary-foreground font-medium">SHA-256 Verified</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border">
          <Smartphone className="w-3.5 h-3.5 text-gaming-blue" />
          <span className="text-xs text-secondary-foreground font-medium">M-Pesa Ready</span>
        </div>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">Balance</span>
          <span className="text-sm font-mono font-bold text-foreground">KES 25,000</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">U</span>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;
