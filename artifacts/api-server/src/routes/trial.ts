import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";
import { getTrialStatus } from "../middlewares/trial";

const router: IRouter = Router();

const TRIAL_MASTER_PASSWORD = process.env.TRIAL_MASTER_PASSWORD || "456654";

// Public: get trial status for logged-in user
router.get("/trial/status", async (req, res): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.json({ isActive: false, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false });
      return;
    }

    const { verifyToken } = await import("../lib/auth");
    const payload = verifyToken(authHeader.slice(7));
    if (!payload) {
      res.json({ isActive: false, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false });
      return;
    }

    const status = await getTrialStatus(payload.userId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to get trial status" });
  }
});

// Super-admin: verify master password
router.post("/trial/verify-master", async (req, res): Promise<void> => {
  try {
    const { password } = req.body;
    if (password === TRIAL_MASTER_PASSWORD) {
      res.json({ valid: true });
    } else {
      res.status(403).json({ valid: false, error: "Invalid master password" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to verify password" });
  }
});

// Super-admin: list all admin accounts with their trial status
router.get("/trial/admins", async (_req, res): Promise<void> => {
  try {
    const admins = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      phone: usersTable.phone,
      email: usersTable.email,
      trialActive: usersTable.trialActive,
      trialDays: usersTable.trialDays,
      trialStart: usersTable.trialStart,
      trialEnd: usersTable.trialEnd,
    }).from(usersTable).where(eq(usersTable.role, "admin"));

    const now = new Date();
    const adminsWithStatus = admins.map(admin => {
      const isExpired = admin.trialEnd ? now > admin.trialEnd : false;
      const diffMs = admin.trialEnd ? admin.trialEnd.getTime() - now.getTime() : 0;
      const daysRemaining = admin.trialEnd ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : null;
      return { ...admin, isExpired, daysRemaining };
    });

    res.json(adminsWithStatus);
  } catch (err) {
    res.status(500).json({ error: "Failed to list admins" });
  }
});

// Super-admin: update trial for a specific admin
router.put("/trial/settings", async (req, res): Promise<void> => {
  try {
    const { isActive, trialDays, adminId, masterPassword } = req.body;

    if (masterPassword !== TRIAL_MASTER_PASSWORD) {
      res.status(403).json({ error: "Invalid master password" });
      return;
    }

    if (!adminId) {
      res.status(400).json({ error: "adminId is required" });
      return;
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, adminId)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    const updateData: any = {};

    if (isActive !== undefined) {
      updateData.trialActive = isActive;
    }

    if (trialDays !== undefined) {
      updateData.trialDays = trialDays;
    }

    if (isActive === true) {
      updateData.trialStart = new Date();
      updateData.trialEnd = new Date(Date.now() + (trialDays || existing.trialDays || 7) * 24 * 60 * 60 * 1000);
      updateData.trialActive = true;
    }

    if (isActive === false) {
      updateData.trialActive = false;
    }

    const [updated] = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, adminId))
      .returning();

    res.json({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      trialActive: updated.trialActive,
      trialDays: updated.trialDays,
      trialStart: updated.trialStart,
      trialEnd: updated.trialEnd,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update trial" });
  }
});

export default router;
