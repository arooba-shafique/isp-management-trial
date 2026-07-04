import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, paymentsTable, subscriptionsTable, usersTable, packagesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function formatPayment(p: typeof paymentsTable.$inferSelect & { customerName?: string | null; customerPhone?: string | null; packageName?: string | null }) {
  return {
    ...p, amount: Number(p.amount), createdAt: p.createdAt.toISOString(),
    verifiedAt: p.verifiedAt?.toISOString() ?? null,
    updatedAt: undefined,
  };
}

router.get("/payments", requireAuth, async (req, res): Promise<void> => {
  const { customerId, status, subscriptionId } = req.query as Record<string, string>;
  const isAdmin = req.user!.role === "admin";
  const targetCustomerId = isAdmin ? (customerId ? parseInt(customerId, 10) : undefined) : req.user!.userId;

  let payments = await db.select().from(paymentsTable).orderBy(paymentsTable.createdAt);

  if (targetCustomerId) payments = payments.filter(p => p.customerId === targetCustomerId);
  if (status) payments = payments.filter(p => p.status === status);
  if (subscriptionId) payments = payments.filter(p => p.subscriptionId === parseInt(subscriptionId, 10));

  const result = await Promise.all(payments.map(async p => {
    const [cust] = await db.select({ name: usersTable.name, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, p.customerId));
    const [sub] = await db.select({ packageId: subscriptionsTable.packageId }).from(subscriptionsTable).where(eq(subscriptionsTable.id, p.subscriptionId));
    let packageName: string | null = null;
    if (sub) {
      const [pkg] = await db.select({ name: packagesTable.name }).from(packagesTable).where(eq(packagesTable.id, sub.packageId));
      packageName = pkg?.name ?? null;
    }
    return formatPayment({ ...p, customerName: cust?.name ?? null, customerPhone: cust?.phone ?? null, packageName });
  }));

  res.json(result);
});

router.post("/payments", requireAuth, async (req, res): Promise<void> => {
  const { subscriptionId, amount, proofImageUrl, note } = req.body;
  if (!subscriptionId || !amount) { res.status(400).json({ error: "subscriptionId and amount required" }); return; }
  const customerId = req.user!.userId;

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, Number(subscriptionId)));
  if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
  if (req.user!.role !== "admin" && sub.customerId !== customerId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [payment] = await db.insert(paymentsTable).values({
    subscriptionId: Number(subscriptionId), customerId, amount: String(amount),
    proofImageUrl: proofImageUrl ?? null, status: "pending", adminNote: note ?? null
  }).returning();

  res.status(201).json(formatPayment(payment));
});

router.post("/payments/:id/verify", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { action, adminNote } = req.body;
  if (!action || !["verify", "reject"].includes(action)) { res.status(400).json({ error: "action must be verify or reject" }); return; }

  const newStatus = action === "verify" ? "verified" : "rejected";
  const updates: Record<string, unknown> = { status: newStatus, adminNote: adminNote ?? null };
  if (action === "verify") updates.verifiedAt = new Date();

  const [payment] = await db.update(paymentsTable).set(updates).where(eq(paymentsTable.id, id)).returning();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }

  if (action === "verify") {
    const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, payment.subscriptionId));
    if (sub) {
      const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, sub.packageId));
      if (pkg) {
        const months = pkg.validity === "quarterly" ? 3 : pkg.validity === "yearly" ? 12 : 1;
        const start = new Date();
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        await db.update(subscriptionsTable).set({
          status: "active",
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0]
        }).where(eq(subscriptionsTable.id, sub.id));
      }
    }
  }

  res.json(formatPayment(payment));
});

export default router;
