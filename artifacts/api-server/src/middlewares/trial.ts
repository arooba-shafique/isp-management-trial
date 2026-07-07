import { Request, Response, NextFunction } from "express";
import { db, trialSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function checkTrialExpired(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [settings] = await db.select().from(trialSettingsTable).limit(1);
    
    if (!settings || !settings.isActive) {
      next();
      return;
    }

    const now = new Date();
    
    if (settings.trialEnd && now > settings.trialEnd) {
      res.status(403).json({ 
        error: "Trial period has expired",
        trialExpired: true,
        trialEnd: settings.trialEnd
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

export async function getTrialStatus(): Promise<{
  isActive: boolean;
  daysRemaining: number | null;
  trialEnd: Date | null;
  isExpired: boolean;
}> {
  try {
    const [settings] = await db.select().from(trialSettingsTable).limit(1);
    
    if (!settings || !settings.isActive) {
      return { isActive: false, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    const now = new Date();
    const trialEnd = settings.trialEnd;
    
    if (!trialEnd) {
      return { isActive: true, daysRemaining: null, trialEnd: null, isExpired: false };
    }

    const isExpired = now > trialEnd;
    const diffMs = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return { isActive: true, daysRemaining, trialEnd, isExpired };
  } catch {
    return { isActive: false, daysRemaining: null, trialEnd: null, isExpired: false };
  }
}
