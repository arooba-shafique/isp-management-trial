import { useQueryClient } from "@tanstack/react-query";
import { useListSubscriptions, useUpdateSubscription, getListSubscriptionsQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Calendar, Wifi } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type Sub = { id: number; customerId: number; packageId: number; status: string; startDate?: string | null; endDate?: string | null; createdAt: string; package?: { name?: string; speedMbps?: number } | null; customerName?: string | null; customerPhone?: string | null };

export default function AdminSubscriptions() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: subscriptions = [], isLoading } = useListSubscriptions(
    statusFilter ? { status: statusFilter } : undefined,
    { query: { queryKey: getListSubscriptionsQueryKey(statusFilter ? { status: statusFilter } : undefined) } }
  );
  const update = useUpdateSubscription();
  const [editId, setEditId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  async function saveEdit(id: number) {
    await update.mutateAsync({ id, data: { status: editStatus as "active" | "pending-payment" | "expired" | "suspended", endDate: editEndDate || undefined } });
    await qc.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
    setEditId(null);
  }

  const sorted = [...(subscriptions as Sub[])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} total</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending-payment">Pending Payment</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No subscriptions</div>
        ) : (
          <div className="divide-y">
            {sorted.map(sub => (
              <div key={sub.id} className="px-5 py-4">
                {editId === sub.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Status</label>
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                          <option value="active">Active</option>
                          <option value="pending-payment">Pending Payment</option>
                          <option value="expired">Expired</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">End Date</label>
                        <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(sub.id)} disabled={update.isPending} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50">Save</button>
                      <button onClick={() => setEditId(null)} className="border px-3 py-1.5 rounded text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wifi size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{sub.customerName ?? `Customer #${sub.customerId}`}</div>
                      <div className="text-xs text-muted-foreground">{sub.customerPhone} &middot; {sub.package?.name ?? `Package #${sub.packageId}`}</div>
                      {(sub.startDate || sub.endDate) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar size={10} />
                          <span>{sub.startDate ?? "—"} &rarr; {sub.endDate ?? "—"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={sub.status} />
                      <button onClick={() => { setEditId(sub.id); setEditStatus(sub.status); setEditEndDate(sub.endDate ?? ""); }} className="text-xs text-primary hover:underline ml-1">Edit</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
