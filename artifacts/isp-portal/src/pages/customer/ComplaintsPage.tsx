import { useQueryClient } from "@tanstack/react-query";
import { useListComplaints, useCreateComplaint, getListComplaintsQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageSquare, Plus, X, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function CustomerComplaints() {
  const qc = useQueryClient();
  const { data: complaints = [], isLoading } = useListComplaints(undefined, { query: { queryKey: getListComplaintsQueryKey() } });
  const create = useCreateComplaint();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!subject.trim() || !description.trim()) { setError("Please fill in all fields"); return; }
    try {
      await create.mutateAsync({ data: { subject, description } });
      await qc.invalidateQueries({ queryKey: getListComplaintsQueryKey() });
      setShowForm(false); setSubject(""); setDescription(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Failed to submit");
    }
  }

  const sorted = [...(complaints as Array<{ id: number; subject: string; description: string; status: string; createdAt: string; updatedAt: string; adminNote?: string | null }>)]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Support & Complaints</h1>
          <p className="text-sm text-muted-foreground">Report issues with your connection</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={14} />
          New Complaint
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle size={16} />
          Complaint submitted. We will respond shortly.
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Submit Complaint</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. No internet, Slow speed" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={create.isPending} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {create.isPending ? "Submitting..." : "Submit Complaint"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="bg-white border rounded-xl text-center py-12 text-sm text-muted-foreground">No complaints submitted</div>
        ) : sorted.map(c => (
          <div key={c.id} className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                  <MessageSquare size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{c.subject}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</div>
                  <p className="text-sm text-muted-foreground mt-1.5">{c.description}</p>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            {c.adminNote && (
              <div className="mt-3 ml-11 bg-muted rounded-lg px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Admin: </span>{c.adminNote}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
