import { useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useGetCustomer, useUpdateCustomer, useSuspendCustomer, useListSubscriptions, useListPayments, useListComplaints, useListZones, getGetCustomerQueryKey, getListCustomersQueryKey, getListZonesQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Edit, Ban, CheckCircle, MapPin, Calendar, Wifi, XCircle, Sparkles } from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function suggestZone(address: string, zones: Array<{ id: number; name: string; description?: string | null }>): { id: number; name: string } | null {
  if (!address.trim()) return null;
  const lower = address.toLowerCase();
  for (const zone of zones) {
    const keywords = ((zone.description ?? "") + " " + zone.name).toLowerCase().split(/[\s,،]+/);
    if (keywords.some(k => k.length > 2 && lower.includes(k))) return zone;
  }
  return null;
}

export default function CustomerDetailPage() {
  const [, params] = useRoute("/admin/customers/:id");
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const id = Number((params as any)?.id ?? 0);

  const { data: customer, isLoading } = useGetCustomer(id, { query: { queryKey: getGetCustomerQueryKey(id), enabled: !!id } });
  const { data: subscriptions = [] } = useListSubscriptions({ customerId: id }, { query: { queryKey: ["subs", id] } });
  const { data: payments = [] } = useListPayments({ customerId: id }, { query: { queryKey: ["payments", id] } });
  const { data: complaints = [] } = useListComplaints({ customerId: id }, { query: { queryKey: ["complaints", id] } });
  const { data: zones = [] } = useListZones({ query: { queryKey: getListZonesQueryKey() } });

  const updateCustomer = useUpdateCustomer();
  const suspendCustomer = useSuspendCustomer();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editZone, setEditZone] = useState("");
  const [error, setError] = useState("");

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  function startEdit() {
    if (!customer) return;
    const c = customer as { name: string; phone: string; address?: string | null; zone?: string | null };
    setEditName(c.name); setEditPhone(c.phone);
    setEditAddress(c.address ?? ""); setEditZone(c.zone ?? "");
    setEditing(true);
  }

  function handleAddressChange(val: string) {
    setEditAddress(val);
    if (!editZone) {
      const suggested = suggestZone(val, zones as Array<{ id: number; name: string; description?: string | null }>);
      if (suggested) setEditZone(suggested.name);
    }
  }

  async function saveEdit() {
    setError("");
    try {
      await updateCustomer.mutateAsync({ id, data: { name: editName, phone: editPhone, address: editAddress, zone: editZone } });
      await qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
      await qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      setEditing(false);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Update failed");
    }
  }

  async function toggleSuspend() {
    if (!customer) return;
    const c = customer as { status: string };
    const newSuspended = c.status !== "suspended";
    await suspendCustomer.mutateAsync({ id, data: { suspended: newSuspended } });
    await qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
    await qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
  }

  async function handleCancelSubscription() {
    const activeSub = (subscriptions as Array<{ id: number; status: string }>).find(s => s.status === "active");
    if (!activeSub) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      const token = localStorage.getItem("isp_token") ?? "";
      const res = await fetch(`${API_BASE}/api/subscriptions/${activeSub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "expired" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCancelError(data.error ?? "Failed to cancel");
        return;
      }
      await qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
      await qc.invalidateQueries({ queryKey: ["subs", id] });
      setCancelSuccess(true);
      setConfirmCancel(false);
      setTimeout(() => setCancelSuccess(false), 4000);
    } catch {
      setCancelError("Network error");
    } finally {
      setCancelLoading(false);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!customer) return <div className="text-center py-12 text-muted-foreground">Customer not found</div>;

  const c = customer as { id: number; name: string; phone: string; status: string; zone?: string | null; address?: string | null; createdAt: string; activeSubscription?: { id: number; status: string; startDate?: string | null; endDate?: string | null; package?: { name?: string; speedMbps?: number; price?: number } | null } | null };
  const allSubs = subscriptions as Array<{ id: number; status: string; startDate?: string | null; endDate?: string | null; package?: { name?: string; speedMbps?: number; price?: number } | null }>;

  const suggestedZone = !c.zone && c.address
    ? suggestZone(c.address, zones as Array<{ id: number; name: string; description?: string | null }>)
    : null;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/customers")} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{c.name}</h1>
          <p className="text-sm text-muted-foreground">{c.phone}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={startEdit} className="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-sm hover:bg-accent transition-colors">
            <Edit size={14} /> Edit
          </button>
          <button onClick={toggleSuspend} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${c.status === "suspended" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
            {c.status === "suspended" ? <><CheckCircle size={14} /> Reactivate</> : <><Ban size={14} /> Suspend</>}
          </button>
        </div>
      </div>

      {/* Auto zone suggestion banner */}
      {suggestedZone && !editing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-700">Zone auto-detected</p>
              <p className="text-xs text-blue-600">Based on address "{c.address}" → <strong>{suggestedZone.name}</strong></p>
            </div>
          </div>
          <button
            onClick={async () => {
              await updateCustomer.mutateAsync({ id, data: { name: c.name, phone: c.phone, address: c.address ?? "", zone: suggestedZone.name } });
              await qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(id) });
            }}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Assign Zone
          </button>
        </div>
      )}

   {editing && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Edit Customer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <div className="w-full px-3 py-2 border rounded-lg text-sm bg-muted/30 text-muted-foreground">{editName}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <div className="w-full px-3 py-2 border rounded-lg text-sm bg-muted/30 text-muted-foreground">{editPhone}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <div className="w-full px-3 py-2 border rounded-lg text-sm bg-muted/30 text-muted-foreground">{editAddress}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Zone</label>
              <select value={editZone} onChange={e => setEditZone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="">Select zone…</option>
                {(zones as Array<{ id: number; name: string }>).map(z => (
                  <option key={z.id} value={z.name}>{z.name}</option>
                ))}
              </select>
              {editAddress && suggestZone(editAddress, zones as Array<{ id: number; name: string; description?: string | null }>) && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Sparkles size={10} /> Auto-suggested based on address
                </p>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} disabled={updateCustomer.isPending} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {updateCustomer.isPending ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={() => setEditing(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <StatusBadge status={c.status} />
          <div className="text-xs text-muted-foreground">Account Status</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <MapPin size={16} className="text-muted-foreground" />
          <div className="text-sm">{c.zone ?? <span className="text-muted-foreground italic">No zone assigned</span>}</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <Calendar size={16} className="text-muted-foreground" />
          <div className="text-xs text-muted-foreground">Joined {new Date(c.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-primary" />
            <h2 className="font-semibold">Subscription</h2>
          </div>
          {c.activeSubscription && !confirmCancel && (
            <button onClick={() => setConfirmCancel(true)} className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 transition-colors">
              <XCircle size={14} /> Expire Subscription
            </button>
          )}
        </div>

        {cancelSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-sm mb-3">
            <CheckCircle size={14} /> Subscription expired. Customer can now subscribe to a new package.
          </div>
        )}

        {confirmCancel && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-red-700 mb-3">Are you sure? This will expire the current subscription and the customer will need to subscribe again.</p>
            {cancelError && <p className="text-sm text-destructive mb-2">{cancelError}</p>}
            <div className="flex gap-2">
              <button onClick={handleCancelSubscription} disabled={cancelLoading} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors">
                {cancelLoading ? "Expiring..." : "Yes, Expire It"}
              </button>
              <button onClick={() => setConfirmCancel(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {allSubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscriptions</p>
        ) : (
          <div className="space-y-3">
            {allSubs.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{sub.package?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{sub.package?.speedMbps} Mbps · Rs. {Number(sub.package?.price ?? 0).toLocaleString()}</div>
                  {sub.endDate && <div className="text-xs text-muted-foreground">Expires: {sub.endDate}</div>}
                </div>
                <StatusBadge status={sub.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold">Payment History ({(payments as unknown[]).length})</div>
        {(payments as unknown[]).length === 0 ? <div className="px-5 py-6 text-sm text-muted-foreground">No payments</div> : (
          <div className="divide-y max-h-48 overflow-y-auto">
            {(payments as Array<{ id: number; amount: number; status: string; createdAt: string }>).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">Rs. {Number(p.amount).toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complaints */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold">Complaints ({(complaints as unknown[]).length})</div>
        {(complaints as unknown[]).length === 0 ? <div className="px-5 py-6 text-sm text-muted-foreground">No complaints</div> : (
          <div className="divide-y max-h-48 overflow-y-auto">
            {(complaints as Array<{ id: number; subject: string; status: string; createdAt: string }>).map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{c.subject}</span>
                  <span className="text-muted-foreground ml-2">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
