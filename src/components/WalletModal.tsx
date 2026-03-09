import { useState } from "react";
import { X, ArrowDownToLine, ArrowUpFromLine, Phone, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  balance: number;
}

type Tab = "deposit" | "withdraw";
type Status = "idle" | "loading" | "success";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 5000];

const WalletModal = ({ open, onClose, balance }: WalletModalProps) => {
  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 10) {
      toast.error("Minimum amount is KES 10");
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error("Enter a valid M-Pesa phone number");
      return;
    }
    if (tab === "withdraw") {
      toast.error("Withdrawals are only available for deposited funds. Please deposit first.");
      return;
    }

    setStatus("loading");
    // Simulate M-Pesa STK push
    await new Promise((r) => setTimeout(r, 2500));
    setStatus("success");
    toast.success(`KES ${numAmount.toLocaleString()} deposited via M-Pesa!`);
    setTimeout(() => {
      setStatus("idle");
      setAmount("");
      setPhone("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Wallet</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance */}
        <div className="px-5 py-4 text-center border-b border-border bg-secondary/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-2xl font-mono font-bold text-foreground">KES {balance.toLocaleString()}</p>
          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            Demo Balance
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("deposit")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              tab === "deposit"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              tab === "withdraw"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </button>
        </div>

        {tab === "withdraw" ? (
          /* Withdrawal blocked - demo funds */
          <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Withdrawal Not Available</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[250px]">
              Your current balance is <strong className="text-foreground">demo money</strong>. 
              You can only withdraw funds that have been deposited via M-Pesa or earned from real-money bets.
            </p>
            <Button
              onClick={() => setTab("deposit")}
              className="w-full py-3 text-sm font-bold uppercase tracking-wider mt-2"
            >
              Deposit Real Money
            </Button>
          </div>
        ) : status === "success" ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <CheckCircle className="w-12 h-12 text-gaming-green animate-scale-in" />
            <p className="text-sm font-semibold text-foreground">Deposit Successful!</p>
            <p className="text-xs text-muted-foreground">Funds added to your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {/* Quick amounts */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Quick Amount</label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      amount === String(amt)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                    }`}
                  >
                    KES {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Amount (KES)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={10}
                placeholder="Enter amount"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="0700000000"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 text-sm font-bold uppercase tracking-wider"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending STK Push...
                </span>
              ) : (
                "Deposit via M-Pesa"
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              You'll receive an M-Pesa prompt on your phone to confirm payment.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
