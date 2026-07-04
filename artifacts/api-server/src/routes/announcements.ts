import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, announcementsTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { sendSms, sendWhatsApp } from "../lib/notifications";

const router: IRouter = Router();

router.get("/announcements", requireAuth, async (req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable).orderBy(announcementsTable.createdAt);
  res.json(announcements.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.post("/announcements", requireAdmin, async (req, res): Promise<void> => {
  const { title, message, targetZone } = req.body;
  if (!title || !message) { res.status(400).json({ error: "title and message required" }); return; }

  let customers = await db.select().from(usersTable).where(eq(usersTable.role, "customer"));
  if (targetZone) customers = customers.filter(c => c.zone === targetZone);

  const recipientCount = customers.length;

  const [announcement] = await db.insert(announcementsTable).values({
    title, message, targetZone: targetZone ?? null, recipientCount
  }).returning();

  const fullMsg = `${title}: ${message}`;
  for (const cust of customers) {
    await sendSms(cust.phone, fullMsg).catch(() => {});
    await sendWhatsApp(cust.phone, fullMsg).catch(() => {});
  }

  res.status(201).json({ ...announcement, createdAt: announcement.createdAt.toISOString() });
});

export default router;
