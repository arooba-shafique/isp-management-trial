import { useQueryClient } from "@tanstack/react-query";
import {
  useListPackages, useCreateSubscription, useListSubscriptions, useSwitchPackage,
  useSubmitPayment, getListSubscriptionsQueryKey, getListPackagesQueryKey, getListPaymentsQueryKey,
} from "@workspace/api-client-react";
import { Wifi, Zap, Calendar, CheckCircle, X, Smartphone, Building2, CreditCard, Hash } from "lucide-react";
import { useState } from "react";

const PAYMENT_METHODS = [
  {
    id: "jazzcash",
    label: "JazzCash",
    icon: Smartphone,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    activeBg: "bg-red-100 border-red-500",
    account: "0300-0000000",
    accountLabel: "Mobile Account",
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    icon: Smartphone,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    activeBg: "bg-green-100 border-green-500",
    account: "0301-0000000",
    accountLabel: "Mobile Account",
  },
  {
    id: "bank",
    label: "Bank Transfer",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    activeBg: "bg-blue-100 border-blue-500",
    account: "PK00 HABB 0000 0000 0000 0000",
    accountLabel: "HBL Account",
  },
];

type Pkg = { id: number; name: string; speedMbps: number; price: number; validity: string; description?: string | null; isActive: boolean };

export default function CustomerPackages() {
  const qc = useQueryClient();
  const { data: packages = [], isLoading } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });
  const { data: subscriptions = [] } = useListSubscriptions(undefined, { query: { queryKey: getListSubscriptionsQueryKey() } });
  const subscribe = useCreateSubscription();
  const switchPkg = useSwitchPackage();
  const submitPayment = useSubmitPayment();

  const [dialogPkg, setDialogPkg] = useState<Pkg | null>(null);
  const [payMethod, setPayMethod] = useState("jazzcash");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  const activeSub = (subscriptions as Array<{ id: number; status: string; packageId: number; package?: { name?: string } }>)
    .find(s => s.status === "active");

  const activePackages = (packages as Pkg[]).filter(p => p.isActive);
  const validityLabel = (v: string) => ({ monthly: "Monthly", quarterly: "Quarterly (3 mo)", yearly: "Yearly" }[v] ?? v);

  function openDialog(pkg: Pkg) {
    setDialogPkg(pkg);
    setPayMethod("jazzcash");
    setAmount(String(pkg.price));
    setTransactionId("");
    setProofUrl("");
    setError("");
  }

  async function handleConfirmPayment() {
    if (!dialogPkg) return;
    if (!transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      let subId: number;
      if (activeSub) {
        const switched = await switchPkg.mutateAsync({ id: activeSub.id, data: { newPackageId: dialogPkg.id } });
        subId = (switched as { id: number }).id;
      } else {
        const created = await subscribe.mutateAsync({ data: { packageId: dialogPkg.id } });
        subId = (created as { id: number }).id;
      }
      await submitPayment.mutateAsync({
        data: {
          subscriptionId: subId,
          amount: Number(amount) || dialogPkg.price,
          proofImageUrl: proofUrl || undefined,
          transactionId: transactionId.trim(),
        } as any,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() }),
        qc.invalidateQueries({ queryKey: getListPaymentsQueryKey() }),
      ]);
      setSuccess(dialogPkg.id);
      setDialogPkg(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === payMethod)!;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Internet Packages</h1>
        <p className="text-sm text-muted-foreground">Choose a plan that fits your needs</p>
      </div>

      {activeSub && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <Wifi size={18} className="text-primary" />
          <div>
            <span className="text-sm font-medium">Current plan: </span>
            <span className="text-sm text-muted-foreground">{activeSub.package?.name ?? "—"}</span>
          </div>
        </div>
      )}

      {success !== null && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle size={16} />
          Subscribed! Payment submitted — awaiting admin verification.
        </div>
      )}

      <div className="grid gap-4">
        {activePackages.map(pkg => {
          const isCurrent = activeSub?.packageId === pkg.id;
          return (
            <div key={pkg.id} className={`bg-white border rounded-xl p-5 shadow-sm relative ${isCurrent ? "border-primary ring-1 ring-primary/20" : ""}`}>
              {isCurrent && (
                <div className="absolute top-3 right-3">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">Current</span>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Wifi size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{pkg.name}</h3>
                  {pkg.description && <p className="text-sm text-muted-foreground mt-0.5">{pkg.description}</p>}
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Zap size={14} className="text-amber-500" />
                      <span>{pkg.speedMbps} Mbps</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      <span>{validityLabel(pkg.validity)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold">Rs. {Number(pkg.price).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{validityLabel(pkg.validity).toLowerCase()}</div>
                </div>
              </div>
             <div className="mt-4">
                <button
                  onClick={() => !isCurrent && !activeSub && openDialog(pkg)}
                  disabled={isCurrent || !!activeSub}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${isCurrent || activeSub ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                >
                  {isCurrent ? "Current Plan" : activeSub ? "Contact Admin to Switch" : "Subscribe"}
                </button>
              </div>
            </div>
          );
        })}
        {activePackages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No packages available</div>
        )}
      </div>

      {/* Payment Dialog */}
      {dialogPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
              <div>
                <h2 className="font-bold text-lg">Complete Payment</h2>
                <p className="text-sm text-muted-foreground">{dialogPkg.name} — Rs. {Number(dialogPkg.price).toLocaleString()}</p>
              </div>
              <button onClick={() => setDialogPkg(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Step 1: choose payment method */}
              <div>
                <p className="text-sm font-semibold mb-3">1. Choose payment method</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(m => {
                    const Icon = m.icon;
                    const active = payMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPayMethod(m.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${active ? m.activeBg : m.bg + " hover:opacity-80"}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? "bg-white" : "bg-white/70"}`}>
                          <Icon size={18} className={m.color} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{m.label}</div>
                          <div className="text-xs text-muted-foreground">{m.accountLabel}</div>
                        </div>
                        {active && <CheckCircle size={16} className={m.color} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: account details */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Send Rs. {Number(dialogPkg.price).toLocaleString()} to:</p>
                <p className="text-sm font-semibold">{selectedMethod.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CreditCard size={14} className="text-muted-foreground" />
                  <span className="font-mono text-sm font-bold tracking-wide">{selectedMethod.account}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">After sending, fill in the details below.</p>
              </div>

              {/* Step 3: amount + transaction ID + proof */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">2. Confirm details</p>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Amount Sent (Rs.)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="e.g. 2000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Transaction ID <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="e.g. TXN123456789"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Enter the transaction/reference ID from your payment receipt.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Screenshot URL <span className="font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Paste image link from WhatsApp / Google Photos…"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "I've Sent the Payment"}
                </button>
                <button
                  onClick={() => setDialogPkg(null)}
                  className="px-4 border rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
