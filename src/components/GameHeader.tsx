import { useState } from "react";
import { Rocket, Shield, Volume2, VolumeX, LogIn, LogOut, User, Wallet } from "lucide-react";
import { useSound } from "@/contexts/SoundContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import WalletModal from "@/components/WalletModal";

const GameHeader = () => {
  const { muted, toggleMute } = useSound();
  const { user, balance, signOut } = useAuth();
  const navigate = useNavigate();
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center glow-primary">
            <Rocket className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground tracking-tight">mozzatbet</span>
            <span className="text-[10px] text-muted-foreground leading-none">Provably Fair</span>
          </div>
        </div>

        {/* Center badges */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border">
            <Shield className="w-3.5 h-3.5 text-gaming-green" />
            <span className="text-xs text-secondary-foreground font-medium">SHA-256 Verified</span>
          </div>
        </div>

        {/* Sound + Auth + Balance */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-foreground" />
            )}
          </button>

          {user ? (
            <>
              <button
                onClick={() => setWalletOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground leading-none">Balance</span>
                    {balance > 0 && (
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-accent text-accent-foreground leading-none">
                        Demo
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground">
                    KES {balance.toLocaleString()}
                  </span>
                </div>
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-colors"
                title="Profile"
              >
                <User className="w-3.5 h-3.5 text-primary" />
              </button>
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </header>

      <WalletModal open={walletOpen} onClose={() => setWalletOpen(false)} balance={balance} />
    </>
  );
};

export default GameHeader;
