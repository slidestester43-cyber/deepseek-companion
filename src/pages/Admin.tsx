import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Eye, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [currentCrashPoint, setCurrentCrashPoint] = useState<number | null>(null);
  const [upcomingPredictions, setUpcomingPredictions] = useState<number[]>([]);
  const [recentBets, setRecentBets] = useState<{ bet_amount: number; cashout_multiplier: number | null; crashed: boolean; profit: number; created_at: string }[]>([]);
  const [stats, setStats] = useState({ totalBets: 0, totalWagered: 0, totalProfit: 0, activeUsers: 0 });

  // Check admin role via user_roles table
  useEffect(() => {
    if (!user) {
      setCheckingRole(false);
      return;
    }
    const checkAdmin = async () => {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      setIsAdmin(!!data && !error);
      setCheckingRole(false);
      if (!data || error) toast.error("Access denied. Admin role required.");
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!loading && !checkingRole && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [loading, checkingRole, user, isAdmin, navigate]);

  // Generate predictions (client-side crash point algorithm)
  const generatePredictions = useCallback(() => {
    const predictions: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = Math.random();
      const crash = Math.max(1.0, (1 / (1 - r)) * 0.97);
      predictions.push(Math.min(Math.round(crash * 100) / 100, 100));
    }
    setUpcomingPredictions(predictions);
  }, []);

  // Listen for crash point updates via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      setCurrentCrashPoint((e as CustomEvent).detail);
    };
    window.addEventListener("admin-crash-point", handler);
    return () => window.removeEventListener("admin-crash-point", handler);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      // Fetch recent bets from all users (admin RLS policy allows this)
      const { data: bets } = await supabase
        .from("bet_history")
        .select("bet_amount, cashout_multiplier, crashed, profit, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (bets) setRecentBets(bets);

      // Stats
      const { count: betCount } = await supabase
        .from("bet_history")
        .select("*", { count: "exact", head: true });

      if (bets) {
        const totalWagered = bets.reduce((s, b) => s + Number(b.bet_amount), 0);
        const totalProfit = bets.reduce((s, b) => s + Number(b.profit), 0);
        setStats(prev => ({ ...prev, totalBets: betCount || 0, totalWagered, totalProfit }));
      }

      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      setStats(prev => ({ ...prev, activeUsers: userCount || 0 }));
    };
    fetchData();
    generatePredictions();
    const interval = setInterval(() => {
      fetchData();
      generatePredictions();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAdmin, generatePredictions]);

  if (loading || checkingRole || !isAdmin) return null;

  const getColor = (val: number) => {
    if (val >= 10) return "text-gaming-gold";
    if (val >= 2) return "text-gaming-green";
    return "text-destructive";
  };

  const getBg = (val: number) => {
    if (val >= 10) return "bg-gaming-gold/10 border-gaming-gold/30";
    if (val >= 2) return "bg-gaming-green/10 border-gaming-green/30";
    return "bg-destructive/10 border-destructive/30";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80">
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <Shield className="w-5 h-5 text-gaming-gold" />
        <h1 className="text-sm font-bold text-foreground">Admin Panel</h1>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Current Round */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Current Round Crash Point</h2>
          </div>
          {currentCrashPoint ? (
            <p className={`font-mono text-4xl font-bold ${getColor(currentCrashPoint)}`}>
              {currentCrashPoint.toFixed(2)}x
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">Navigate to the game page to see live crash points</p>
          )}
        </div>

        {/* Upcoming Predictions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gaming-green" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Next Predictions</h2>
            </div>
            <Button size="sm" variant="outline" onClick={generatePredictions} className="text-xs">
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3 text-gaming-gold" />
            <p className="text-[10px] text-muted-foreground">Predictions are probabilistic estimates based on the crash algorithm</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {upcomingPredictions.map((val, i) => (
              <div key={i} className={`rounded-lg border p-3 text-center ${getBg(val)}`}>
                <p className="text-[10px] text-muted-foreground mb-1">#{i + 1}</p>
                <p className={`font-mono text-lg font-bold ${getColor(val)}`}>{val.toFixed(2)}x</p>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase">Total Bets</p>
            <p className="font-mono text-xl font-bold text-foreground">{stats.totalBets.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase">Total Wagered</p>
            <p className="font-mono text-xl font-bold text-foreground">KES {stats.totalWagered.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase">House Profit</p>
            <p className={`font-mono text-xl font-bold ${-stats.totalProfit >= 0 ? "text-gaming-green" : "text-destructive"}`}>
              KES {(-stats.totalProfit).toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-gaming-blue" />
              <p className="text-[10px] text-muted-foreground uppercase">Users</p>
            </div>
            <p className="font-mono text-xl font-bold text-foreground">{stats.activeUsers}</p>
          </div>
        </div>

        {/* Recent Bets from All Users */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Bets (All Users)</h3>
          </div>
          {recentBets.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No bets recorded yet</div>
          ) : (
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
              {recentBets.map((bet, i) => (
                <div key={i} className={`px-4 py-3 flex items-center justify-between ${bet.crashed ? "bg-destructive/5" : "bg-gaming-green/5"}`}>
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground">KES {Number(bet.bet_amount).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(bet.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {bet.crashed ? (
                      <span className="text-destructive font-mono text-sm font-semibold">Crashed</span>
                    ) : (
                      <span className="text-gaming-green font-mono text-sm font-semibold">{bet.cashout_multiplier ? Number(bet.cashout_multiplier).toFixed(2) : "—"}x</span>
                    )}
                    <p className={`text-[10px] font-mono ${Number(bet.profit) >= 0 ? "text-gaming-green" : "text-destructive"}`}>
                      {Number(bet.profit) >= 0 ? "+" : ""}KES {Number(bet.profit).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
