import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, complaintsTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function formatComplaint(c: typeof complaintsTable.$inferSelect & { customerName?: string | null; customerPhone?: string | null }) {
  return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() };
}

router.get("/complaints", requireAuth, async (req, res): Promise<void> => {
  const { status, customerId } = req.query as Record<string, string>;
  const isAdmin = req.user!.role === "admin";

  let complaints = await db.select().from(complaintsTable).orderBy(complaintsTable.createdAt);

  if (!isAdmin) complaints = complaints.filter(c => c.customerId === req.user!.userId);
  else if (customerId) complaints = complaints.filter(c => c.customerId === parseInt(customerId, 10));
  if (status) complaints = complaints.filter(c => c.status === status);

  const result = await Promise.all(complaints.map(async c => {
    const [cust] = await db.select({ name: usersTable.name, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, c.customerId));
    return formatComplaint({ ...c, customerName: cust?.name ?? null, customerPhone: cust?.phone ?? null });
  }));
  res.json(result);
});

router.post("/complaints", requireAuth, async (req, res): Promise<void> => {
  const { subject, description } = req.body;
  if (!subject || !description) { res.status(400).json({ error: "subject and description required" }); return; }
  const [complaint] = await db.insert(complaintsTable).values({
    customerId: req.user!.userId, subject, description, status: "open"
  }).returning();
  res.status(201).json(formatComplaint(complaint));
});

router.patch("/complaints/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, adminNote } = req.body;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (adminNote !== undefined) updates.adminNote = adminNote;

  const [complaint] = await db.update(complaintsTable).set(updates).where(eq(complaintsTable.id, id)).returning();
  if (!complaint) { res.status(404).json({ error: "Complaint not found" }); return; }

  const [cust] = await db.select({ name: usersTable.name, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, complaint.customerId));
  res.json(formatComplaint({ ...complaint, customerName: cust?.name ?? null, customerPhone: cust?.phone ?? null }));
});

export default router;
