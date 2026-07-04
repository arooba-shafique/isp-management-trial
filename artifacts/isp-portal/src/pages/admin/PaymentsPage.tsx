import { useQueryClient } from "@tanstack/react-query";
import { useListPayments, useVerifyPayment, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CreditCard, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

type Payment = { id: number; amount: number; status: string; createdAt: string; proofImageUrl?: string | null; adminNote?: string | null; customerName?: string | null; customerPhone?: string | null; packageName?: string | null };

export default function AdminPayments() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: payments = [], isLoading } = useListPayments(
    statusFilter ? { status: statusFilter } : undefined,
    { query: { queryKey: getListPaymentsQueryKey(statusFilter ? { status: statusFilter } : undefined) } }
  );
  const verify = useVerifyPayment();
  const [actionId, setActionId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState<"verify" | "reject" | null>(null);

  async function handleAction(id: number, action: "verify" | "reject") {
    await verify.mutateAsync({ id, data: { action, adminNote: note || undefined } });
    await qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    setActionId(null); setNote(""); setActionType(null);
  }

  const sorted = [...(payments as Payment[])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} {statusFilter || "total"}</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="bg-white border rounded-xl text-center py-12 text-sm text-muted-foreground">No payments</div>
        ) : sorted.map(p => (
          <div key={p.id} className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard size={16} className="text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Rs. {Number(p.amount).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{p.customerName ?? "—"} &middot; {p.customerPhone}</div>
                  <div className="text-xs text-muted-foreground">{p.packageName} &middot; {new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>

            {p.proofImageUrl && (
              <a href={p.proofImageUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ExternalLink size={12} /> View payment proof
              </a>
            )}

            {p.adminNote && <div className="mt-2 bg-muted rounded px-3 py-2 text-xs text-muted-foreground">{p.adminNote}</div>}

            {p.status === "pending" && (
              actionId === p.id ? (
                <div className="mt-3 space-y-2">
                  <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Admin note (optional)" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(p.id, actionType!)} disabled={verify.isPending} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${actionType === "verify" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
                      {actionType === "verify" ? <><CheckCircle size={14} /> Verify Payment</> : <><XCircle size={14} /> Reject Payment</>}
                    </button>
                    <button onClick={() => { setActionId(null); setNote(""); }} className="px-3 border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setActionId(p.id); setActionType("verify"); }} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                    <CheckCircle size={13} /> Verify
                  </button>
                  <button onClick={() => { setActionId(p.id); setActionType("reject"); }} className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
