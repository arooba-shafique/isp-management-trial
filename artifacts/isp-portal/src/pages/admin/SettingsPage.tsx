import { ArrowLeft, Lock, CheckCircle, AlertCircle, Timer, Play, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetTrialStatus, getGetTrialStatusQueryKey } from "@workspace/api-client-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function AdminSettingsPage() {
  const [, navigate] = useLocation();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Trial management
  const { data: trialStatus, refetch: refetchTrial } = useGetTrialStatus({ 
    query: { queryKey: getGetTrialStatusQueryKey() } 
  });
  const [trialDays, setTrialDays] = useState(7);
  const [trialMessage, setTrialMessage] = useState("");
  const [trialError, setTrialError] = useState("");
  const [trialLoading, setTrialLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");
    if (!oldPassword || !newPassword || !confirmPassword) { setError("All fields required"); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match"); return; }
    if (newPassword.length < 6) { setError("New password must be at least 6 characters"); return; }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to change password"); return; }
      setMessage("Password changed successfully");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartTrial() {
    setTrialError(""); setTrialMessage("");
    setTrialLoading(true);
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/trial/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: true, trialDays }),
      });
      const data = await res.json();
      if (!res.ok) { setTrialError(data.error ?? "Failed to start trial"); return; }
      setTrialMessage("Trial started successfully");
      refetchTrial();
    } catch {
      setTrialError("Network error");
    } finally {
      setTrialLoading(false);
    }
  }

  async function handleStopTrial() {
    setTrialError(""); setTrialMessage("");
    setTrialLoading(true);
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/trial/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: false }),
      });
      const data = await res.json();
      if (!res.ok) { setTrialError(data.error ?? "Failed to stop trial"); return; }
      setTrialMessage("Trial stopped successfully");
      refetchTrial();
    } catch {
      setTrialError("Network error");
    } finally {
      setTrialLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/dashboard")} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Change your password</p>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700">
          <CheckCircle size={16} />
          {message}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Current Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
              placeholder="Enter current password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">New Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          {isLoading ? "Changing..." : "Change Password"}
        </button>
      </form>

      {/* Trial Management Section */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-primary" />
          <h2 className="font-semibold">Trial Management</h2>
        </div>

        {trialStatus?.isActive && (
          <div className={`p-3 rounded-lg ${trialStatus.isExpired ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <p className={`text-sm font-medium ${trialStatus.isExpired ? 'text-red-800' : 'text-blue-800'}`}>
              {trialStatus.isExpired 
                ? 'Trial Expired' 
                : `Trial Active - ${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''} remaining`
              }
            </p>
            {trialStatus.trialEnd && (
              <p className={`text-xs mt-1 ${trialStatus.isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                Ends: {new Date(trialStatus.trialEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Trial Duration (days)</label>
            <input 
              type="number" 
              value={trialDays} 
              onChange={e => setTrialDays(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex gap-2">
            {!trialStatus?.isActive ? (
              <button 
                onClick={handleStartTrial}
                disabled={trialLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Play size={14} />
                {trialLoading ? "Starting..." : "Start Trial"}
              </button>
            ) : (
              <button 
                onClick={handleStopTrial}
                disabled={trialLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Square size={14} />
                {trialLoading ? "Stopping..." : "Stop Trial"}
              </button>
            )}
          </div>
        </div>

        {trialMessage && (
          <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700">
            <CheckCircle size={14} />
            {trialMessage}
          </div>
        )}

        {trialError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            {trialError}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          When trial is active, all non-public API routes will be blocked after the trial period expires.
          Public routes (login, landing page) remain accessible.
        </p>
      </div>
    </div>
  );
}
