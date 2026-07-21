import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, announcementsTable, usersTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { sendSms, sendWhatsApp } from "../lib/notifications";

const router: IRouter = Router();

router.get("/announcements", requireAuth, async (req, res): Promise<void> => {
  const isAdmin = req.user!.role === "admin";
  let announcements;
  if (isAdmin) {
    announcements = await db.select().from(announcementsTable).where(eq(announcementsTable.adminId, req.user!.userId)).orderBy(announcementsTable.createdAt);
  } else {
    announcements = await db.select().from(announcementsTable).orderBy(announcementsTable.createdAt);
  }
  res.json(announcements.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.post("/announcements", requireAdmin, async (req, res): Promise<void> => {
  const { title, message, targetZone } = req.body;
  if (!title || !message) { res.status(400).json({ error: "title and message required" }); return; }

  let customers = await db.select().from(usersTable).where(eq(usersTable.role, "customer"));
  if (targetZone) customers = customers.filter(c => c.zone === targetZone);

  const recipientCount = customers.length;

  const [announcement] = await db.insert(announcementsTable).values({
    adminId: req.user!.userId, title, message, targetZone: targetZone ?? null, recipientCount
  }).returning();

  // Create notifications for each customer so bell icon shows badge
  for (const cust of customers) {
    await db.insert(notificationsTable).values({
      userId: cust.id,
      type: "announcement",
      title,
      message,
      relatedId: announcement.id,
    }).catch(() => {});

    const fullMsg = `${title}: ${message}`;
    await sendSms(cust.phone, fullMsg).catch(() => {});
    await sendWhatsApp(cust.phone, fullMsg).catch(() => {});
  }

  res.status(201).json({ ...announcement, createdAt: announcement.createdAt.toISOString() });
});

export default router;
