import { useQueryClient } from "@tanstack/react-query";
import { useListComplaints, useUpdateComplaint, getListComplaintsQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

type Complaint = { id: number; subject: string; description: string; status: string; createdAt: string; updatedAt: string; adminNote?: string | null; customerName?: string | null; customerPhone?: string | null };

export default function AdminComplaints() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: complaints = [], isLoading } = useListComplaints(
    statusFilter ? { status: statusFilter } : undefined,
    { query: { queryKey: getListComplaintsQueryKey(statusFilter ? { status: statusFilter } : undefined) } }
  );
  const update = useUpdateComplaint();
  const [editId, setEditId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");

  async function handleUpdate(id: number) {
    await update.mutateAsync({ id, data: { status: newStatus as "open" | "in-progress" | "resolved", adminNote: note || undefined } });
    await qc.invalidateQueries({ queryKey: getListComplaintsQueryKey() });
    setEditId(null); setNote(""); setNewStatus("");
  }

  const sorted = [...(complaints as Complaint[])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Complaints</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} {statusFilter || "total"}</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="bg-white border rounded-xl text-center py-12 text-sm text-muted-foreground">No complaints</div>
        ) : sorted.map(c => (
          <div key={c.id} className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <MessageSquare size={14} className="text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{c.subject}</div>
                  <div className="text-xs text-muted-foreground">{c.customerName} &middot; {c.customerPhone}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm text-muted-foreground ml-11 mb-3">{c.description}</p>
            {c.adminNote && <div className="ml-11 bg-muted rounded px-3 py-2 text-xs text-muted-foreground mb-3">{c.adminNote}</div>}

            {c.status !== "resolved" && (
              editId === c.id ? (
                <div className="ml-11 space-y-2">
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Admin note..." className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(c.id)} disabled={update.isPending} className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50">Update</button>
                    <button onClick={() => setEditId(null)} className="border px-3 py-1.5 rounded text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="ml-11">
                  <button onClick={() => { setEditId(c.id); setNewStatus(c.status); setNote(c.adminNote ?? ""); }} className="text-xs text-primary hover:underline">Update status</button>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
