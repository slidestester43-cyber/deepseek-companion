import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Rocket, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "phone";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    setLoading(true);
    try {
      if (!otpSent) {
        const { error } = mode === "signup"
          ? await supabase.auth.signUp({
              phone,
              password,
              options: { data: { username, display_name: username } },
            })
          : await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        setOtpSent(true);
        toast.success("OTP sent to your phone!");
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: mode === "signup" ? "sms" : "sms",
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "email") handleEmailAuth();
    else handlePhoneAuth();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center glow-primary">
            <Rocket className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Maboompesa</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Welcome back! Sign in to play." : "Create your account to start playing."}
          </p>
        </div>

        {/* Auth method toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => { setMethod("email"); setOtpSent(false); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
              method === "email" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button
            onClick={() => { setMethod("phone"); setOtpSent(false); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
              method === "phone" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Choose a username"
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {method === "email" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 pr-10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+254700000000"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}
              {otpSent && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground text-sm font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold uppercase tracking-wider"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google */}
        <Button
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setOtpSent(false); }}
            className="text-primary font-semibold hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>

        {/* Demo link */}
        <p className="text-center text-xs text-muted-foreground">
          <button onClick={() => navigate("/")} className="text-primary/70 hover:text-primary hover:underline">
            Watch the game as a demo →
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
