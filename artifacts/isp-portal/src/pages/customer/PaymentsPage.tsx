import { useQueryClient } from "@tanstack/react-query";
import { useListPayments, useSubmitPayment, useListSubscriptions, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CreditCard, Upload, CheckCircle, X } from "lucide-react";
import { useState } from "react";

export default function CustomerPayments() {
  const qc = useQueryClient();
  const { data: payments = [], isLoading } = useListPayments(undefined, { query: { queryKey: getListPaymentsQueryKey() } });
  const { data: subscriptions = [] } = useListSubscriptions(undefined, { query: { queryKey: ["subs-for-payment"] } });
  const submit = useSubmitPayment();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [subId, setSubId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pendingSubs = (subscriptions as Array<{ id: number; status: string; package?: { name?: string } }>)
    .filter(s => s.status === "active" || s.status === "pending-payment");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!subId || !amount) { setError("Please fill all required fields"); return; }
    try {
      await submit.mutateAsync({ data: { subscriptionId: Number(subId), amount: Number(amount), proofImageUrl: proofUrl || undefined } });
      await qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
      setShowForm(false);
      setAmount(""); setProofUrl(""); setSubId(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Failed to submit payment");
    }
  }

  const sorted = [...(payments as Array<{ id: number; amount: number; status: string; createdAt: string; packageName?: string | null; adminNote?: string | null; proofImageUrl?: string | null }>)]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">Your payment history and submissions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Upload size={14} />
          Submit Payment
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle size={16} />
          Payment submitted successfully. Awaiting admin verification.
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Submit Payment Proof</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Subscription</label>
              <select value={subId} onChange={e => setSubId(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">Select subscription...</option>
                {pendingSubs.map(s => (
                  <option key={s.id} value={s.id}>{s.package?.name ?? `Subscription #${s.id}`} — {s.status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount Paid (Rs.)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1500" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Payment Screenshot URL <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <p className="text-xs text-muted-foreground mt-1">Upload your bank transfer screenshot to an image host and paste the URL</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submit.isPending} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submit.isPending ? "Submitting..." : "Submit Payment"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No payments yet</div>
        ) : (
          <div className="divide-y">
            {sorted.map(p => (
              <div key={p.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard size={14} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Rs. {Number(p.amount).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</div>
                      {p.packageName && <div className="text-xs text-muted-foreground">{p.packageName}</div>}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.adminNote && (
                  <div className="mt-2 ml-11 text-xs text-muted-foreground bg-muted rounded px-2 py-1">{p.adminNote}</div>
                )}
                {p.proofImageUrl && (
                  <div className="mt-2 ml-11">
                    <a href={p.proofImageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View proof</a>
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
