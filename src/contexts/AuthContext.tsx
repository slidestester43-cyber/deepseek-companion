import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

const DEMO_INITIAL_BALANCE = 1000;
const DEMO_BALANCE_KEY = "mozzatbet_demo_balance";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  balance: number; // real balance (from DB, 0 if not logged in)
  demoBalance: number; // demo balance (localStorage-backed)
  isDemo: boolean; // true when playing with demo money
  refreshBalance: () => Promise<void>;
  updateDemoBalance: (delta: number) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  balance: 0,
  demoBalance: DEMO_INITIAL_BALANCE,
  isDemo: true,
  refreshBalance: async () => {},
  updateDemoBalance: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [demoBalance, setDemoBalance] = useState(() => {
    const stored = localStorage.getItem(DEMO_BALANCE_KEY);
    return stored ? Number(stored) : DEMO_INITIAL_BALANCE;
  });

  // Demo balance is used when not logged in, or when logged in but real balance is 0
  const isDemo = !user || balance === 0;

  const refreshBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("balances")
      .select("amount")
      .eq("user_id", user.id)
      .single();
    if (data) setBalance(Number(data.amount));
  };

  const updateDemoBalance = useCallback((delta: number) => {
    setDemoBalance((prev) => {
      const next = Math.max(0, prev + delta);
      localStorage.setItem(DEMO_BALANCE_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshBalance();
    } else {
      setBalance(0);
    }
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, balance, demoBalance, isDemo, refreshBalance, updateDemoBalance, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
