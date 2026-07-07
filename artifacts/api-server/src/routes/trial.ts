import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, trialSettingsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import { getTrialStatus } from "../middlewares/trial";

const router: IRouter = Router();

// Public: get trial status (for frontend to check)
router.get("/trial/status", async (_req, res): Promise<void> => {
  try {
    const status = await getTrialStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to get trial status" });
  }
});

// Admin: get trial settings
router.get("/trial/settings", requireAdmin, async (_req, res): Promise<void> => {
  try {
    const [settings] = await db.select().from(trialSettingsTable).limit(1);
    res.json(settings || { isActive: false, trialDays: 7 });
  } catch (err) {
    res.status(500).json({ error: "Failed to get trial settings" });
  }
});

// Admin: update trial settings (start trial)
router.put("/trial/settings", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { isActive, trialDays } = req.body;
    
    const [existing] = await db.select().from(trialSettingsTable).limit(1);
    
    if (existing) {
      const updateData: any = { isActive };
      if (trialDays !== undefined) updateData.trialDays = trialDays;
      
      if (isActive && !existing.trialStart) {
        updateData.trialStart = new Date();
        updateData.trialEnd = new Date(Date.now() + (trialDays || 7) * 24 * 60 * 60 * 1000);
      } else if (isActive && existing.trialEnd) {
        updateData.trialEnd = new Date(existing.trialEnd.getTime() + (trialDays || 7) * 24 * 60 * 60 * 1000);
      }
      
      const [updated] = await db.update(trialSettingsTable)
        .set(updateData)
        .where(eq(trialSettingsTable.id, existing.id))
        .returning();
      res.json(updated);
    } else {
      const trialStart = isActive ? new Date() : null;
      const trialEnd = isActive ? new Date(Date.now() + (trialDays || 7) * 24 * 60 * 60 * 1000) : null;
      
      const [created] = await db.insert(trialSettingsTable)
        .values({ isActive, trialDays: trialDays || 7, trialStart, trialEnd })
        .returning();
      res.status(201).json(created);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update trial settings" });
  }
});

export default router;
