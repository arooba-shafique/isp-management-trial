import { useQueryClient } from "@tanstack/react-query";
import { useListAnnouncements, useCreateAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import { Megaphone, Plus, X, CheckCircle, Users } from "lucide-react";
import { useState } from "react";

type Announcement = { id: number; title: string; message: string; targetZone?: string | null; recipientCount?: number | null; createdAt: string };

export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const { data: announcements = [], isLoading } = useListAnnouncements({ query: { queryKey: getListAnnouncementsQueryKey() } });
  const create = useCreateAnnouncement();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [zone, setZone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !message.trim()) { setError("Title and message are required"); return; }
    try {
      await create.mutateAsync({ data: { title, message, targetZone: zone || undefined } });
      await qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
      setShowForm(false); setTitle(""); setMessage(""); setZone("");
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setError(err?.data?.error ?? err?.message ?? "Failed to send");
    }
  }

  const sorted = [...(announcements as Announcement[])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Send bulk notifications to customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle size={16} />
          Announcement sent to all customers successfully
        </div>
      )}

      {showForm && (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">New Announcement</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-muted-foreground" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Network Maintenance Notice" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Your announcement message..." rows={4} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Zone Filter <span className="text-muted-foreground font-normal">(leave blank for all customers)</span></label>
              <input type="text" value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. Zone A" className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={create.isPending} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {create.isPending ? "Sending..." : "Send Announcement"}
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
          <div className="bg-white border rounded-xl text-center py-12 text-sm text-muted-foreground">No announcements sent yet</div>
        ) : sorted.map(a => (
          <div key={a.id} className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Megaphone size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{a.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  {a.targetZone && <span>Zone: {a.targetZone}</span>}
                  {a.recipientCount !== null && a.recipientCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {a.recipientCount} recipients
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
