import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function checkTrialExpired(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      next();
      return;
    }

    const { verifyToken } = await import("../lib/auth");
    const payload = verifyToken(authHeader.slice(7));
    if (!payload) {
      next();
      return;
    }

    const [user] = await db.select({
      role: usersTable.role,
      trialActive: usersTable.trialActive,
      trialStart: usersTable.trialStart,
      trialEnd: usersTable.trialEnd,
    }).from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);

    if (!user || user.role !== "admin") {
      next();
      return;
    }

    if (!user.trialStart) {
      next();
      return;
    }

    if (!user.trialActive) {
      res.status(403).json({
        error: "Trial has been stopped",
        trialStopped: true
      });
      return;
    }

    const now = new Date();
    if (user.trialEnd && now > user.trialEnd) {
      res.status(403).json({
        error: "Trial period has expired",
        trialExpired: true,
        trialEnd: user.trialEnd
      });
      return;
    }

    next();
  } catch {
    next();
  }
}

export async function getTrialStatus(userId?: number): Promise<{
  isActive: boolean;
  isStopped: boolean;
  daysRemaining: number | null;
  trialEnd: Date | null;
  isExpired: boolean;
}> {
  try {
    if (!userId) {
      return { isActive: false, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    const [user] = await db.select({
      trialActive: usersTable.trialActive,
      trialStart: usersTable.trialStart,
      trialEnd: usersTable.trialEnd,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (!user || !user.trialStart) {
      return { isActive: false, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    if (!user.trialActive) {
      return { isActive: false, isStopped: true, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    const now = new Date();
    const trialEnd = user.trialEnd;

    if (!trialEnd) {
      return { isActive: true, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    const isExpired = now > trialEnd;
    const diffMs = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return { isActive: true, isStopped: false, daysRemaining, trialEnd, isExpired };
  } catch {
    return { isActive: false, isStopped: false, daysRemaining: null, trialEnd: null, isExpired: false };
  }
}
