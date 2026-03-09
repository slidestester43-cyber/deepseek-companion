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
  const [recentRounds, setRecentRounds] = useState<{ crash_point: number; created_at: string }[]>([]);
  const [stats, setStats] = useState({ totalBets: 0, totalWagered: 0, totalProfit: 0, activeUsers: 0 });

  // Check admin role
  useEffect(() => {
    if (!user) {
      setCheckingRole(false);
      return;
    }
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      setIsAdmin(!!data);
      setCheckingRole(false);
      if (!data) toast.error("Access denied. Admin role required.");
    };
    checkAdmin();
  }, [user]);

  // Redirect non-admin
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
    const handler = (e: CustomEvent) => {
      setCurrentCrashPoint(e.detail);
    };
    window.addEventListener("admin-crash-point" as any, handler);
    return () => window.removeEventListener("admin-crash-point" as any, handler);
  }, []);

  // Fetch recent rounds from DB
  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      const { data: rounds } = await supabase
        .from("crash_rounds")
        .select("crash_point, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (rounds) setRecentRounds(rounds);

      // Fetch stats
      const { count: betCount } = await supabase
        .from("bet_history")
        .select("*", { count: "exact", head: true });

      const { data: betData } = await supabase
        .from("bet_history")
        .select("bet_amount, profit");

      if (betData) {
        const totalWagered = betData.reduce((s, b) => s + Number(b.bet_amount), 0);
        const totalProfit = betData.reduce((s, b) => s + Number(b.profit), 0);
        setStats(prev => ({ ...prev, totalBets: betCount || 0, totalWagered, totalProfit }));
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      // Use count from profiles
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

        {/* Recent Rounds History */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Crash Rounds</h3>
          </div>
          {recentRounds.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No rounds recorded yet</div>
          ) : (
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
              {recentRounds.map((round, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{new Date(round.created_at).toLocaleString()}</span>
                  <span className={`font-mono text-sm font-bold ${getColor(Number(round.crash_point))}`}>
                    {Number(round.crash_point).toFixed(2)}x
                  </span>
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
