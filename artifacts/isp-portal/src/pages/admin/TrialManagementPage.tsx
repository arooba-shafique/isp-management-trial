import { useState, useEffect } from "react";
import { Clock, Play, Square, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const TRIAL_ADMIN_PASSWORD = "456654";

export default function TrialManagementPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [trialDays, setTrialDays] = useState(7);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("trial_admin_auth");
    if (saved === TRIAL_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchTrialStatus();
    }
  }, []);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === TRIAL_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("trial_admin_auth", password);
      fetchTrialStatus();
    } else {
      setPasswordError("Invalid password");
    }
  }

  async function fetchTrialStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/trial/status`);
      const data = await res.json();
      setTrialStatus(data);
    } catch {
      setError("Failed to fetch trial status");
    }
  }

  async function handleStartTrial() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/trial/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: true, trialDays }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to start trial"); return; }
      setMessage("Trial started successfully");
      fetchTrialStatus();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStopTrial() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/trial/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: false }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to stop trial"); return; }
      setMessage("Trial stopped successfully");
      fetchTrialStatus();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trial Control Panel</h1>
          <p className="text-gray-500 text-sm mb-6">Enter admin password to continue</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                placeholder="Enter password"
                className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {passwordError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Access Control Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trial Management</h1>
              <p className="text-sm text-gray-500">Control trial periods for this deployment</p>
            </div>
            <button
              onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem("trial_admin_auth"); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>

          {trialStatus && (
            <div className={`p-4 rounded-xl mb-6 ${trialStatus.isActive ? (trialStatus.isExpired ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200') : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <Clock size={20} className={trialStatus.isActive ? (trialStatus.isExpired ? 'text-red-600' : 'text-blue-600') : 'text-gray-400'} />
                <div>
                  <p className={`font-semibold ${trialStatus.isActive ? (trialStatus.isExpired ? 'text-red-800' : 'text-blue-800') : 'text-gray-600'}`}>
                    {trialStatus.isActive 
                      ? (trialStatus.isExpired ? 'Trial Expired' : `Trial Active - ${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''} remaining`)
                      : 'Trial Inactive'
                    }
                  </p>
                  {trialStatus.trialEnd && (
                    <p className={`text-xs mt-1 ${trialStatus.isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                      {trialStatus.isExpired ? 'Expired' : 'Ends'}: {new Date(trialStatus.trialEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Trial Duration (days)</label>
              <input
                type="number"
                value={trialDays}
                onChange={e => setTrialDays(Number(e.target.value))}
                min={1}
                max={30}
                className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="flex gap-3">
              {!trialStatus?.isActive ? (
                <button
                  onClick={handleStartTrial}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Play size={16} />
                  {loading ? "Starting..." : "Start Trial"}
                </button>
              ) : (
                <button
                  onClick={handleStopTrial}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Square size={16} />
                  {loading ? "Stopping..." : "Stop Trial"}
                </button>
              )}
            </div>

            {message && (
              <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700">
                <CheckCircle size={16} />
                {message}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-3">How It Works</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>1. Set the trial duration in days</li>
            <li>2. Click "Start Trial" to begin the countdown</li>
            <li>3. Trial users will see normal app with no trial UI</li>
            <li>4. After expiry, all API access is blocked automatically</li>
            <li>5. Click "Stop Trial" to disable trial checks anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
