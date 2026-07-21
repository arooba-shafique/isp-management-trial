import { useState, useEffect } from "react";
import { Clock, Play, Square, CheckCircle, AlertCircle, Lock, Eye, EyeOff, Users, Calendar } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface AdminInfo {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  trialActive: boolean;
  trialDays: number;
  trialStart: string | null;
  trialEnd: string | null;
  isExpired: boolean;
  daysRemaining: number | null;
}

export default function TrialManagementPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [extendDays, setExtendDays] = useState(7);
  const [selectedAdmin, setSelectedAdmin] = useState<number | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("trial_master_auth");
    if (saved === "verified") {
      setIsAuthenticated(true);
      fetchAdmins();
    }
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/trial/verify-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem("trial_master_auth", "verified");
        fetchAdmins();
      } else {
        setPasswordError("Invalid password");
      }
    } catch {
      setPasswordError("Network error");
    }
  }

  async function fetchAdmins() {
    setLoading(true);
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/trial/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAdmins(data);
    } catch {
      setError("Failed to load admin accounts");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTrial(adminId: number) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/trial/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: true, trialDays: extendDays, adminId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to start trial"); return; }
      setMessage(`Trial started for ${data.name}`);
      fetchAdmins();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStopTrial(adminId: number) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("isp_token");
      const res = await fetch(`${API_BASE}/api/trial/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: false, adminId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to stop trial"); return; }
      setMessage(`Trial stopped for ${data.name}`);
      fetchAdmins();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtendTrial(adminId: number) {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("isp_token");
      const admin = admins.find(a => a.id === adminId);
      const currentDays = admin?.daysRemaining ?? 0;
      const newDays = currentDays + extendDays;
      const res = await fetch(`${API_BASE}/api/trial/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: true, trialDays: newDays, adminId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to extend trial"); return; }
      setMessage(`Trial extended by ${extendDays} days for ${data.name}`);
      fetchAdmins();
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
          <p className="text-gray-500 text-sm mb-6">Enter master password to continue</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                placeholder="Enter master password"
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trial Management</h1>
              <p className="text-sm text-gray-500">Manage trial periods for all admin accounts</p>
            </div>
            <button
              onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem("trial_master_auth"); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-blue-800">Trial Duration Setting</p>
                <p className="text-xs text-blue-600">Set how many days to start/extend</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={extendDays}
                  onChange={e => setExtendDays(Number(e.target.value))}
                  min={1}
                  max={90}
                  className="w-20 px-3 py-2 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <span className="text-sm text-blue-600">days</span>
              </div>
            </div>
          </div>

          {loading && admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading admin accounts...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No admin accounts found</div>
          ) : (
            <div className="space-y-3">
              {admins.map(admin => (
                <div key={admin.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{admin.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.phone}{admin.email ? ` | ${admin.email}` : ""}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {admin.trialStart ? (
                          admin.trialActive && !admin.isExpired ? (
                            <div>
                              <p className="text-sm font-semibold text-blue-700">
                                <Clock size={14} className="inline mr-1" />
                                {admin.daysRemaining} day{admin.daysRemaining !== 1 ? "s" : ""} left
                              </p>
                              <p className="text-xs text-blue-500">
                                Ends: {new Date(admin.trialEnd!).toLocaleDateString()}
                              </p>
                            </div>
                          ) : admin.isExpired ? (
                            <p className="text-sm font-semibold text-red-700">
                              <AlertCircle size={14} className="inline mr-1" />
                              Expired
                            </p>
                          ) : (
                            <p className="text-sm font-semibold text-gray-500">
                              Stopped
                            </p>
                          )
                        ) : (
                          <p className="text-sm text-gray-400">No trial started</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!admin.trialStart || (!admin.trialActive && !admin.isExpired) ? (
                          <button
                            onClick={() => handleStartTrial(admin.id)}
                            disabled={loading}
                            className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Play size={12} />
                            Start
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStopTrial(admin.id)}
                              disabled={loading}
                              className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                              <Square size={12} />
                              Stop
                            </button>
                            <button
                              onClick={() => handleExtendTrial(admin.id)}
                              disabled={loading}
                              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Calendar size={12} />
                              +{extendDays}d
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-emerald-700 mt-4">
              <CheckCircle size={16} />
              {message}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-3">How It Works</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>1. Enter your master password to access this panel</li>
            <li>2. See all admin accounts and their trial status</li>
            <li>3. Set trial duration (days) at the top</li>
            <li>4. Click Start, Stop, or Extend for any admin</li>
            <li>5. Client changing their password does not affect you</li>
            <li>6. Each admin only sees their own data (customers, payments, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
