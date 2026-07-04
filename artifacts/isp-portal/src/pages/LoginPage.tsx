import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { } from "@workspace/api-client-react";
import { Wifi, Phone, User, MapPin, Lock, Mail, KeyRound } from "lucide-react";

const ADMIN_PHONES = ["03496641464", "03286687112"];
const API_BASE = import.meta.env.VITE_API_URL ?? "";

type Step = "phone" | "password" | "register" | "claim" | "forgot" | "forgot-sent" | "reset";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsClaim, setNeedsClaim] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetToken, setShowResetToken] = useState("");

  async function handleCheckPhone(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim();
    if (!trimmed) { setError("Please enter your phone number"); return; }

    if (ADMIN_PHONES.includes(trimmed)) {
      setStep("password"); return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error checking phone"); return; }

      if (data.type === "new") { setStep("register"); }
      else if (data.needsClaim) { setNeedsClaim(true); setStep("claim"); }
      else { setStep("password"); }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) { setError("Please enter your password"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Invalid password"); return; }
      login(data.token);
      navigate(data.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim() || !address.trim()) { setError("Name, email, password and address are required"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name, email: email.trim(), password, address }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      login(data.token);
      navigate("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) { setError("Please set a password"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/claim-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to activate account"); return; }
      login(data.token);
      navigate("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setShowResetToken("");
    if (!forgotEmail.trim()) { setError("Please enter your email"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send reset email"); return; }
      if (data.fallback) {
        setShowResetToken(data.resetToken);
        setStep("reset");
      } else {
        setStep("forgot-sent");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!resetToken || !newPassword) { setError("Reset token and new password required"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to reset password"); return; }
      login(data.token);
      navigate(data.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Wifi size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NetLink ISP</h1>
          <p className="text-sidebar-foreground/60 text-sm mt-1">Customer & Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          {step === "phone" && (
            <form onSubmit={handleCheckPhone} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Sign In</h2>
                <p className="text-sm text-muted-foreground">Enter your phone number to continue</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="03XX-XXXXXXX" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    disabled={isLoading} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Checking..." : "Continue"}
              </button>
              <p className="text-xs text-center text-muted-foreground">New users will be registered automatically</p>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">{ADMIN_PHONES.includes(phone.trim()) ? "Admin Login" : "Welcome Back"}</h2>
                <p className="text-sm text-muted-foreground">Enter your password for <strong>{phone}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    disabled={isLoading} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
              <button type="button" onClick={() => { setStep("forgot"); setError(""); setForgotEmail(""); }} className="w-full text-sm text-primary hover:underline transition-colors">
                Forgot password?
              </button>
              <button type="button" onClick={() => { setStep("phone"); setError(""); setPassword(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Change phone number
              </button>
            </form>
          )}

          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Create Account</h2>
                <p className="text-sm text-muted-foreground">Complete your profile to get started</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Muhammad Ali"
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ali@example.com"
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a password"
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Address <span className="text-destructive">*</span></label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street / Mohalla"
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
             
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
              <button type="button" onClick={() => { setStep("phone"); setError(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Change phone number
              </button>
            </form>
          )}

          {step === "claim" && (
            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Activate Account</h2>
                <p className="text-sm text-muted-foreground">Your account was created by the admin. Set a password to activate.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Set a password"
                    className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Activating..." : "Activate Account"}
              </button>
            </form>
          )}

          {step === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Forgot Password</h2>
                <p className="text-sm text-muted-foreground">Enter your registered email to receive a reset code</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="your@email.com" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Sending..." : "Send Reset Code"}
              </button>
              <button type="button" onClick={() => { setStep("password"); setError(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to sign in
              </button>
            </form>
          )}

          {step === "forgot-sent" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Check Your Email</h2>
                <p className="text-sm text-muted-foreground">We sent a password reset link to <strong>{forgotEmail}</strong></p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700">
                Click the link in the email to reset your password. The link expires in 1 hour.
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="button" onClick={() => { setStep("forgot"); setError(""); }} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Resend email
              </button>
              <button type="button" onClick={() => { setStep("phone"); setError(""); setForgotEmail(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to sign in
              </button>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Reset Password</h2>
                <p className="text-sm text-muted-foreground">Enter the reset token and your new password</p>
              </div>
              {showResetToken && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-amber-800 mb-1">Your Reset Token (copy this):</p>
                  <code className="block bg-white border rounded px-2 py-1 text-xs break-all select-all">{showResetToken}</code>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Reset Token</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={resetToken} onChange={e => setResetToken(e.target.value)}
                    placeholder="Paste reset token" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" disabled={isLoading} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? "Resetting..." : "Reset Password & Sign In"}
              </button>
              <button type="button" onClick={() => { setStep("forgot"); setError(""); setShowResetToken(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
